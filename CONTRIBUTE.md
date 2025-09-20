# How to Contribute to BetterBahn

We are thrilled that you're interested in contributing to BetterBahn! Every contribution, no matter how small, is valuable and greatly appreciated. These guidelines will help you understand the process.

## Table of Contents

* [Code of Conduct](#code-of-conduct)
* [How Can I Help?](#how-can-i-help)
  * [Reporting Bugs](#reporting-bugs)
  * [Suggesting New Features](#suggesting-new-features)
  * [Submitting Your First Pull Request](#submitting-your-first-pull-request)
* [Git Commit Messages](#git-commit-messages)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](/CODE_OF_CONDUCT.md). Please take a moment to read it. We expect all contributors to adhere to this code to ensure an open and welcoming environment.

## How Can I Help?

There are many ways to contribute to the project. We welcome every form of support!

### Reporting Bugs

If you find a bug, we kindly ask you to proceed as follows:

1. **Search existing issues:** Check under [Issues](https://github.com/l2xu/betterbahn/issues) to see if the bug has already been reported.
2. **Gather information:** To help us fix the bug quickly, we need as much information as possible.
    * The version of BetterBahn you are using.
    * Your operating system and its version.
    * A clear and concise description of the bug.
    * Steps to reproduce the bug.
    * What you expected to happen versus what actually happened.
    * Any relevant error messages or screenshots.
3. **Create a new issue:** If the bug hasn't been reported yet, create a new issue using our [Bug Report Template](https://github.com/l2xu/betterbahn/issues/new?template=bug_report.md).

### Suggesting New Features

Do you have an idea for a new feature or an enhancement?

1. **Search existing issues:** Check if your idea has already been suggested under [Issues](https://github.com/l2xu/betterbahn/issues).
2. **Create a new issue:** Describe your idea in as much detail as possible using our [Feature Request Template](https://github.com/l2xu/betterbahn/issues/new?template=feature_request.md). Explain the problem your idea solves and why it would be useful for the project.

### Submitting Your First Pull Request

Code contributions are the heart of an open-source project. Here is the basic workflow for submitting a Pull Request (PR):

1. **Find or create an issue:** Every PR should relate to an existing issue. If one doesn't exist, create one and briefly discuss the planned change with the maintainers.
2. **Fork the repository:** Click the "Fork" button in the top-right corner of the project's GitHub page.
3. **Clone your fork locally:**

    ```shell
    git clone [https://github.com/YOUR-USERNAME/](https://github.com/YOUR-USERNAME/)betterbahn.git
    ```

4. **Create a new branch:** Choose a descriptive name for your branch (e.g., `feature/new-login-feature` or `fix/calculation-bug`).

    ```shell
    git checkout -b feature/descriptive-name
    ```

5. **Make your changes:** Implement your feature or fix the bug.
6. **Add tests:** If you are adding a new feature, please include corresponding unit or integration tests.
7. **Run the tests (Not implemented yet!):** Ensure that all tests pass successfully.

    ```shell
    # Example command, adapt it for your project
    pnpm test
    ```

8. **Commit your changes:** Write a clear and concise commit message (see [Style Guides](#git-commit-messages)).

    ```shell
    git add .
    git commit -m "feat: Add new login feature (closes #123)"
    ```

9. **Push your changes to your fork:**

    ```shell
    git push origin feature/descriptive-name
    ```

10. **Open a Pull Request:** Go to your fork on GitHub and click "Compare & pull request".
    * Choose the `main` branch of the original project as the base branch.
    * Give your PR a descriptive title and a detailed description of your changes. Reference the related issue (e.g., "Closes #123").
11. **Wait for the review:** The project maintainers will review your code and may leave feedback or request changes.

## Git Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This helps us automate changelog generation and keeps the project history readable.

Each commit message should consist of a type, an optional scope, and a description:
`<type>(<scope>): <description>`

* **feat:** A new feature.
* **fix:** A bug fix.
* **docs:** Changes to the documentation.
* **style:** Code formatting, missing semicolons, etc. (no change in code logic).
* **refactor:** Code changes that neither fix a bug nor add a feature.
* **test:** Adding or correcting tests.
* **chore:** Changes to the build process or auxiliary tools.

**Example:** `feat(auth): Implement OAuth2 authentication`

Thank you for your contribution!
