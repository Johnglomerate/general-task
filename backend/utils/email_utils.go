package utils

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"regexp"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/constants"
)

func ExtractSenderName(sendLine string) (string, string) {
	exp := regexp.MustCompile("([^\"].+[^\\s\"])\"*\\s+<(.+)>")
	matches := exp.FindStringSubmatch(sendLine)
	if len(matches) == 3 {
		return matches[1], matches[2]
	} else {
		return sendLine, sendLine
	}
}

func ExtractEmailDomain(email string) string {
	exp := regexp.MustCompile("@(\\S+)") //nolint
	matches := exp.FindStringSubmatch(email)
	if len(matches) == 2 {
		return matches[1]
	} else {
		return email
	}
}

func IsOpenEmailAddress(domain string) bool {
	return constants.OPEN_EMAIL_PROVIDERS[domain]
}

// Email validation taken from https://golangcode.com/validate-an-email-address/
var emailRegex = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

// isEmailValid checks if the email provided passes the required structure and length.
func IsEmailValid(e string) bool {
	if len(e) < 3 && len(e) > 254 {
		return false
	}
	return emailRegex.MatchString(e)
}

const MANDRILL_SEND_URL = "https://mandrillapp.com/api/1.0/messages/send"

type mandrillRecipient struct {
	Email string `json:"email"`
	Type  string `json:"type"`
}

type mandrillMessage struct {
	FromEmail string              `json:"from_email"`
	FromName  string              `json:"from_name"`
	Subject   string              `json:"subject"`
	Text      string              `json:"text"`
	To        []mandrillRecipient `json:"to"`
}

type mandrillSendRequest struct {
	Key     string          `json:"key"`
	Message mandrillMessage `json:"message"`
}

func SendMandrillEmail(to, subject, text string) error {
	from := config.GetConfigValue("EMAIL_FROM")
	if from == "" {
		from = "julian@generaltask.com"
	}
	payload, err := json.Marshal(mandrillSendRequest{
		Key: config.GetConfigValue("MANDRILL_CLIENT_SECRET"),
		Message: mandrillMessage{
			FromEmail: from,
			FromName:  "General Task",
			Subject:   subject,
			Text:      text,
			To:        []mandrillRecipient{{Email: to, Type: "to"}},
		},
	})
	if err != nil {
		return err
	}
	req, err := http.NewRequest("POST", MANDRILL_SEND_URL, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	req.Header.Add("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
	if resp.StatusCode != http.StatusOK {
		return errors.New("email send failed")
	}
	return nil
}

func TestMailchimpEmail() error {
	return SendMandrillEmail("julian@generaltask.com", "General Task Test", "Testing emails from General Task!")
}
