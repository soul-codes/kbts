## [0.4.5](https://github.com/soul-codes/kbts/compare/0.4.4...0.4.5) (2023-03-29)


### Bug Fixes

* 🐛 allow api-transform to be used in CJS ([a072005](https://github.com/soul-codes/kbts/commit/a07200514da3e91a3424fddb5b180f3c8ae52d86))

## [0.4.4](https://github.com/soul-codes/kbts/compare/0.4.3...0.4.4) (2023-03-27)


### Bug Fixes

* 🐛 release ts-plugin as a common JS plugin ([63aa222](https://github.com/soul-codes/kbts/commit/63aa2228e3574191d09f9da86c150ab79dc762fc))

## [0.4.3](https://github.com/soul-codes/kbts/compare/0.4.2...0.4.3) (2023-02-08)


### Bug Fixes

* 🐛 more fixes to spacing issues ([5dd0bcd](https://github.com/soul-codes/kbts/commit/5dd0bcdaff0ea626ff564a5603395cbdb63ad6b1))

## [0.4.2](https://github.com/soul-codes/kbts/compare/0.4.1...0.4.2) (2023-02-07)


### Bug Fixes

* 🐛 incorrect spacing in ad-hoc paragraph blocks ([7b52bee](https://github.com/soul-codes/kbts/commit/7b52bee0567317c97630610811d55e4786fa3576))

## [0.4.1](https://github.com/soul-codes/kbts/compare/0.3.1...0.4.1) (2023-02-05)


### Bug Fixes

* 🐛 fix duplicated ref counting owing to lazies ([cabb091](https://github.com/soul-codes/kbts/commit/cabb09169bfc3f2ce19b85c970da333834161765))
* 🐛 incorrect embed condition for KB in template strings ([1192ad5](https://github.com/soul-codes/kbts/commit/1192ad5f93360d7241eafd8027a3e8ec84e8be88))
* 🐛 incorrect embed conditioning by ref count ([3d71d3b](https://github.com/soul-codes/kbts/commit/3d71d3b3a2346e85b061bd52578eeb059d9227fc))
* 🐛 incorrect emit condition resolution ([31c75b2](https://github.com/soul-codes/kbts/commit/31c75b295779fbc43a7eaed25060dee0b75fbe4a))


### Features

* 🎸 isKB() utility ([e81a61f](https://github.com/soul-codes/kbts/commit/e81a61fad2b5126550f815818687d53d39b7f193))

## [0.3.1](https://github.com/soul-codes/kbts/compare/0.3.0...0.3.1) (2023-02-04)

# [0.3.0](https://github.com/soul-codes/kbts/compare/0.2.1...0.3.0) (2023-02-04)


### Features

* 🎸 rewrite and add experimental api kb/ts plugin feature ([5895542](https://github.com/soul-codes/kbts/commit/5895542c6cb833085eccbbdb09806f92cb8a5c25))


### BREAKING CHANGES

* 🧨 markdown renderer's defaultFilename is renamed to preferredFilename. Rendering is now asynchronous, owing to interpolations being asynchronous.

## [0.2.1](https://github.com/soul-codes/kbts/compare/0.2.0...0.2.1) (2023-02-03)


### Bug Fixes

* 🐛 markdown render: emit relative paths ([6119bd3](https://github.com/soul-codes/kbts/commit/6119bd397bc2d2e6df1e23bc3d26000b1653fab3))

# [0.2.0](https://github.com/soul-codes/kbts/compare/0.1.1...0.2.0) (2023-01-30)


### Bug Fixes

* 🐛 missed calling markdown paragraph as block content ([401526c](https://github.com/soul-codes/kbts/commit/401526c5160e8e3ee0979afec171615b244f0467))


### Features

* 🎸 allow markdown paths to be specified as iterable [KB, path] pairs ([3555703](https://github.com/soul-codes/kbts/commit/35557038e15072d6a67eb2f64e3c223ee65e3137))
* 🎸 support remark semantic block ([42b4331](https://github.com/soul-codes/kbts/commit/42b4331531cb0a812a59aa5b48a66399a1cf6578))

## [0.1.1](https://github.com/soul-codes/kbts/compare/0.1.0...0.1.1) (2023-01-30)


### Bug Fixes

* 🐛 missing typeVersions for the markdown renderer ([b1b082a](https://github.com/soul-codes/kbts/commit/b1b082ab0fe2fa2a6169e39b0d7adf7255df2e35))



# [0.1.0](https://github.com/soul-codes/kbts/compare/0.1.0...0.1.1) (2023-01-30)

