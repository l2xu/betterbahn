# BetterBahn

BetterBahn is a web app for finding the best train journeys in Germany. While split ticketing is supported to help save money, it is rather the exception. The app will be extended with many more features in the future.

## Technology

This project uses the [db-vendo-client](https://github.com/public-transport/db-vendo-client) for accessing Deutsche Bahn ticketing data, which is licensed under the ISC License.

## Legal Notice

This is not an official repository or project of Deutsche Bahn AG. It is an independent project and not affiliated with or endorsed by Deutsche Bahn. To use this code or the db-vendo-client permission from the Deutsche Bahn AG is necessary.

## Getting Started

To run the project locally:

1. Clone the repository
2. Install dependencies with `npm install`
3. (Optional) Configure authentication by creating a `.env.local` file with `NEXT_PUBLIC_AUTH_PASSWORD=your_password_here`
4. Start the development server with `npm run dev`

### Authentication

BetterBahn supports optional password protection:

- Set `NEXT_PUBLIC_AUTH_PASSWORD` environment variable to enable authentication
- Users will be prompted for the password on their first visit
- Authentication is stored locally and persists across browser sessions
- Leave the environment variable unset to disable authentication

## Docker

You can also build and run BetterBahn as a Docker container. A `Dockerfile` is included in the repository.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International Public License (CC BY-NC 4.0). See the [LICENSE](./LICENSE) file for details.

## Community

Join the [Discord community](https://discord.gg/eDZF75HG) to ask questions, share feedback, and connect with other users and contributors.

## How it works

BetterBahn searches for train journeys and can use split ticketing to help you find cheaper options—though this is usually the exception, not the rule. For a detailed explanation and demonstration, check out the [YouTube video](https://www.youtube.com/watch?v=SxKtI8f5QTU&t=1s).

## About the Author

Created by [Lukas Weihrauch](https://lukasweihrauch.de).

If you like what I do, consider supporting me: [ko-fi.com/lukasweihrauch](https://ko-fi.com/lukasweihrauch)

---

Made with ❤️ for train travelers in Germany.

---
