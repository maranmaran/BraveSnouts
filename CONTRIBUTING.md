# Contributing guidelines

## Commit messages

Commit messages should be following [convetional commits specification](https://www.conventionalcommits.org/en/v1.0.0/#specification)

Commit message should be constructed in following manner: `<type>[optional scope]: <description> <[skip-ci] or [build] tag>

Example:
* `fix: Quick fixes on auctions component [skip-ci]`
* `feat[BS-452]: Finished postal services feature [build]`

Types of commit messages include:
* **build:** Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
* **ci:** Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
* **docs:** Documentation only changes
* **feat:** A new feature
* **fix:** A bug fix
* **perf:** A code change that improves performance
* **refactor:** A code change that neither fixes a bug nor adds a feature
* **style:** Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **test:** Adding missing tests or correcting existing tests

## Git branching policy

Two main branches:
* **dev** - dev test releases
* **main** - only production releases

When developing feature please branch out of latest **dev** into feature/featureName
After that if multiple people are working on feature branch branch out to <user>/<user-branch-name>

Example:

      dev
      |
      | - - feature/auctions-report
            |
            | - - murh/auctions-report-layout
            | - - murh/auctions-report-data-access

After the feature branch is ready it's merged into **dev**

