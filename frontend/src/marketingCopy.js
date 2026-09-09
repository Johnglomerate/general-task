const SUBSCRIPTION_TRIAL_DAYS = 67
const SUBSCRIPTION_PRICE = '$2/month'
const SUBSCRIPTION_TRIAL_OFFER = `${SUBSCRIPTION_TRIAL_DAYS}-day free trial, then ${SUBSCRIPTION_PRICE}`
const MARKETING_META_TITLE = `General Task - Personal productivity for ${SUBSCRIPTION_PRICE}`
const MARKETING_META_DESCRIPTION = `Plan tasks, calendar, pull requests, and integrations with General Task. Start with a ${SUBSCRIPTION_TRIAL_OFFER}.`
const MARKETING_SOCIAL_DESCRIPTION = `Plan tasks, calendar, pull requests, and integrations with a ${SUBSCRIPTION_TRIAL_OFFER}.`

module.exports = {
    MARKETING_META_DESCRIPTION,
    MARKETING_META_TITLE,
    MARKETING_SOCIAL_DESCRIPTION,
    SUBSCRIPTION_PRICE,
    SUBSCRIPTION_TRIAL_DAYS,
    SUBSCRIPTION_TRIAL_OFFER,
}
