# GitHub Copilot Instructions for BetterBahn

## Project Overview

BetterBahn is a web application for finding optimal train journeys in Germany. It helps users discover cheaper travel options through split ticketing while providing a better user experience than the official Deutsche Bahn website.

**Key Features:**
- Train journey search with real-time data
- Split-ticket analysis to find cost savings
- Support for BahnCard discounts and Deutschland-Ticket
- German-focused UI and user experience

## Technology Stack

- **Framework**: Next.js 15.3.4 with React 19
- **Styling**: TailwindCSS v4 with PostCSS
- **APIs**: Deutsche Bahn integration via `db-vendo-client`
- **Data Processing**: Puppeteer for web scraping tasks
- **Deployment**: Docker with standalone output
- **Language**: JavaScript (ES6+)

## Code Style and Standards

### Language Preferences
- **UI Text**: German language for user-facing content
- **Code Comments**: German for business logic explanations
- **Variable Names**: English for technical terms, German for domain-specific concepts
- **Error Messages**: German for user-facing errors

### Code Structure
- Use functional components with hooks (React)
- Prefer `async/await` over Promise chains
- Use meaningful variable names that reflect the German train domain
- Include comprehensive error handling with user-friendly German messages

### File Organization
- API routes in `app/api/` following Next.js 13+ app directory structure
- Components in `/components` directory
- Utilities in `/utils` directory
- German-specific configurations in root config files

## Domain Knowledge

### German Railway Terms
- **Verbindung**: Journey/connection
- **Umstieg**: Transfer/connection
- **Bahnhof**: Train station
- **Abfahrt/Ankunft**: Departure/arrival
- **BahnCard**: Deutsche Bahn discount card (25%, 50%, 100%)
- **Deutschland-Ticket**: Monthly nationwide transport ticket
- **Reiseklasse**: Travel class (1st/2nd class)

### Key Business Logic
- Split ticketing analysis to find cheaper alternatives
- Real-time journey search with Deutsche Bahn data
- Price comparison between direct and split ticket options
- Support for various discount schemes and passenger types

## API Integration

### Deutsche Bahn APIs
- Use `db-vendo-client` for official DB data access
- Handle rate limiting and API quotas carefully
- Include proper error handling for API failures
- Cache responses when appropriate to reduce API calls

### Key API Endpoints
- `/api/journeys` - Main journey search
- `/api/split-journey` - Split ticket analysis
- URL parsing for DB booking links

## Architecture Patterns

### Error Handling
- Always provide German error messages to users
- Log technical details in English for debugging
- Use consistent error response formats across APIs
- Handle network failures gracefully

### State Management
- Use React hooks for component state
- Keep API responses in appropriate component state
- Handle loading and error states consistently

### Performance Considerations
- Use Next.js optimizations (standalone builds, etc.)
- Implement proper loading states for long-running operations
- Cache API responses where possible
- Optimize for mobile users (common in travel scenarios)

## Development Guidelines

### New Features
- Follow existing patterns in the codebase
- Add German comments for complex business logic
- Include error handling for all API interactions
- Test with real German train stations and routes

### Dependencies
- Prefer existing dependencies over adding new ones
- Update dependencies cautiously due to API integrations
- Test thoroughly after dependency updates

### Docker and Deployment
- Maintain compatibility with existing Dockerfile
- Use standalone Next.js output for production
- Handle Puppeteer dependencies correctly in containers

## Testing Approach

- Focus on API integration testing with real Deutsche Bahn data
- Test with common German travel scenarios
- Validate split-ticket calculations carefully
- Test error scenarios (invalid stations, past dates, etc.)

## Common Patterns

### Date/Time Handling
- Use German timezone (Europe/Berlin)
- Format dates in German format (DD.MM.YYYY)
- Handle departure time validation (no past dates)

### Station Handling
- Use Deutsche Bahn station IDs consistently
- Provide station name fallbacks for display
- Handle station lookup errors gracefully

### Price Calculations
- Handle different currency formats
- Account for discount cards in calculations
- Show savings clearly in German format

## Security Considerations

- Never commit API keys or credentials
- Sanitize user inputs, especially URLs and station names
- Rate limit API calls appropriately
- Validate all user-provided data

## Maintenance Notes

- Keep db-vendo-client updated for API compatibility
- Monitor Deutsche Bahn API changes and deprecations
- Update German translations as needed
- Maintain Docker compatibility for deployment