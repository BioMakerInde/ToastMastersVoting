# Toastmasters Voting System

A modern, secure voting platform for Toastmasters clubs built with Next.js, TypeScript, Prisma, and Supabase.

## 🚀 Features

- **Member Management**: Register members, manage clubs, and assign roles (Admin, Officer, Member, Guest)
- **Dynamic Voting Categories**: Create, edit, and delete custom voting categories
- **Secure Voting**: One vote per member per category with time-bound sessions
- **Real-time Results**: View results after voting closes with winner determination
- **QR Code Integration**: Quick member check-in and identification
- **Role-Based Access Control**: Different permissions for admins, officers, and members
- **Mobile-Ready**: Built with future iOS/Android app support in mind

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account (free tier available)
- Git

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd toastmasters-voting
npm install
```

### 2. Set Up Supabase Database

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to Project Settings > Database
4. Copy the connection string (URI format)

### 3. Configure Environment Variables

Update the `.env.local` file with your Supabase credentials:

```env
# Database - Replace with your Supabase connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# NextAuth - Generate a secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push

# (Optional) Seed default categories
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
toastmasters-voting/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── categories/    # Category management
│   │   ├── votes/         # Voting endpoints
│   │   └── results/       # Results calculation
│   ├── dashboard/         # Member dashboard
│   ├── admin/             # Admin panel
│   └── page.tsx           # Landing page
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # Auth utilities
│   ├── vote-validator.ts  # Vote validation
│   └── qr-generator.ts    # QR code generation
├── prisma/
│   └── schema.prisma      # Database schema
└── middleware.ts          # Route protection
```

## 🗄️ Database Schema

- **User**: Authentication and profile data
- **Club**: Toastmasters club information
- **Member**: Club membership with roles
- **Meeting**: Meeting sessions with voting windows
- **VotingCategory**: Dynamic voting categories
- **Nomination**: Members nominated for voting
- **Vote**: Individual votes with uniqueness constraints
- **VoteResult**: Aggregated results per meeting

## 🔐 Default Voting Categories

- Best Speaker
- Best Table Topic Speaker
- Best Evaluator
- Best Meeting Leader
- Best Big 3

Admins can add, edit, or delete categories as needed.

## 🚀 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy!

### 3. Run Database Migrations

After deployment, run migrations in Vercel:

```bash
npx prisma db push
```

## 📱 Future: Mobile App (Phase 2)

This backend is designed to support React Native mobile apps:

- Same Supabase database
- Same authentication system
- Shared TypeScript types
- REST API ready for mobile consumption

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - Login

### Categories
- `GET /api/categories?clubId={id}` - List categories
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories` - Update category (Admin)
- `DELETE /api/categories?categoryId={id}` - Delete category (Admin)

### Voting
- `POST /api/votes` - Submit vote
- `GET /api/votes?meetingId={id}` - View votes (Admin)

### Results
- `GET /api/results?meetingId={id}` - Get results (after voting closes)
- `POST /api/results` - Calculate results (Admin)

## 🤝 Contributing

This is a club management system. For feature requests or issues, please contact your club administrator.

## 📄 License

MIT License - feel free to use for your Toastmasters club!
