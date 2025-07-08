# Pyintel Lucen - Desktop Productivity Suite

A powerful desktop productivity app built with React, Tauri, and Supabase, featuring AI-powered assistance and comprehensive app blocking capabilities.

## Features

### 🏠 Home Dashboard
- **To-Do List Management**: Create, manage, and track tasks with priority levels
- **Work Log Timer**: Focus sessions with customizable durations or free timer
- **Productivity Analytics**: Track completed tasks and active sessions
- **Real-time Statistics**: View daily progress and productivity metrics

### 🚫 Block Apps
- **App Detection**: Automatically scan for installed applications
- **AI Categorization**: Gemini AI categorizes apps by type (Education, Entertainment, Social Media, etc.)
- **Usage Tracking**: Monitor time spent in each application
- **Time Limits**: Set custom time limits per app with visual progress indicators
- **Category-based Blocking**: Block entire categories or individual apps
- **Real-time Monitoring**: See which apps are currently active

### 🤖 Athera Advisor (AI Assistant)
- **Conversational AI**: Chat with an intelligent assistant powered by Gemini AI
- **Agentic Mode**: AI can take actions like creating tasks, changing themes, etc.
- **Life Rules Integration**: Get advice based on personalized life principles
- **Action Confirmation**: Safety confirmations for potentially dangerous actions
- **Context-Aware**: Maintains conversation history for better responses

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Desktop Framework**: Tauri (Rust-based)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: Google Gemini AI
- **UI Components**: Custom components with Framer Motion animations
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/
│   ├── Layouts/
│   │   └── DashboardLayout.tsx    # Main layout with navigation
│   ├── ui/                        # Reusable UI components
│   └── gemini-advisor.tsx         # AI assistant panel
├── pages/
│   ├── DashboardPage.tsx          # Home page with todo & work log
│   ├── BlockAppsPage.tsx          # App blocking management
│   └── LoginPage.tsx              # Authentication
├── lib/
│   ├── supabaseClient.ts          # Database client
│   ├── gemini-config.ts           # AI configuration
│   └── agenticService.ts          # AI action handling
└── sql/
    └── setup_productivity_tables.sql # Database schema
```

## Database Schema

### Tables
- **todos**: Task management with priorities and completion status
- **work_sessions**: Time tracking for focus sessions
- **blocked_apps**: App information and blocking settings
- **app_categories**: Predefined app categories

### Key Features
- Row Level Security (RLS) for user data isolation
- Automatic timestamp updates
- Efficient indexing for performance
- User-specific data access

## Getting Started

### Prerequisites
- Node.js 18+
- Rust and Tauri CLI
- Supabase account
- Google AI Studio API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tauri-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL script in `src/sql/setup_productivity_tables.sql`
   - Enable Row Level Security

5. **Run the development server**
   ```bash
   npm run tauri dev
   ```

### Building for Production

```bash
npm run tauri build
```

## Key Components

### DashboardPage
The main productivity hub featuring:
- Interactive to-do list with drag-and-drop
- Focus timer with preset durations
- Real-time session tracking
- Daily productivity statistics

### BlockAppsPage
Comprehensive app management with:
- System app detection and scanning
- AI-powered categorization via Gemini
- Granular time limit controls
- Category and individual app blocking
- Usage analytics and trends

### Athera Advisor
AI assistant with advanced capabilities:
- Natural language conversation
- Context-aware responses
- Action execution (task creation, theme changes)
- Safety confirmations for sensitive operations
- Persistent conversation history

## Customization

### Adding New App Categories
Update the `defaultCategories` array in `BlockAppsPage.tsx` or add to the database:

```sql
INSERT INTO app_categories (name, color, icon, is_blocked) VALUES
('Custom Category', 'bg-indigo-500', '🔧', false);
```

### Extending AI Capabilities
Add new actions in `agenticService.ts`:

```typescript
case 'CUSTOM_ACTION':
  return await handleCustomAction(action.parameters);
```

### UI Theming
Customize the design by modifying:
- `tailwind.config.js` for color schemes
- Component styles in individual files
- Global CSS variables in `globals.css`

## Security Features

- **Authentication**: Secure user authentication via Supabase
- **RLS**: Database-level security ensuring users only access their data
- **Action Confirmation**: AI actions require user confirmation for safety
- **Input Validation**: All user inputs are validated and sanitized

## Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Efficient Queries**: Optimized database queries with proper indexing
- **Caching**: Strategic caching of frequently accessed data
- **Animations**: Hardware-accelerated animations via Framer Motion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments for implementation details

---

Built with ❤️ using modern web technologies and AI-powered assistance.
