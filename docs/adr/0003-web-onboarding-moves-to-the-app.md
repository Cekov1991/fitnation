---
status: accepted
---

# Web onboarding moves to the app

The web app had a full onboarding flow (questionnaire → program generation), duplicating the mobile one. We decided the web app is a registration funnel only: a signed-in user with `onboarding_completed_at === null` is sent to an App Download Screen (store badges + QR to the backend's `/get` smart redirect) instead of `/onboarding`, for every user on every domain — no partner-subdomain special-casing, since every user has a partner. Onboarding and welcome-program generation live only in the mobile app, so there is one onboarding codepath to maintain and partner customers land in the app, which is where the product wants them. Login, password reset and the post-onboarding web app stay untouched for now.
