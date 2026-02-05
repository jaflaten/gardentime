# User Management Plan

## Status: ✅ IMPLEMENTED

## Current State

The application has complete user management:
- **Backend**: Full auth with JWT, profile management, password reset
- **Frontend**: Login, Register, Profile, Forgot Password, Reset Password pages
- **User Model**: `UserEntity` with email, username, password, firstName, lastName, role (USER/ADMIN), enabled flag
- **Test User**: "testuser" is created in `DataInitializer.kt` for development convenience

---

## Implemented Features

### Phase 1: Core User Features ✅
- [x] **User Profile Page** (`/profile`)
  - View profile info (username, email, name, member since)
  - Edit firstName/lastName
  - Backend: `GET/PUT /api/users/me` endpoints

- [x] **Change Password** (on profile page)
  - Requires current password + new password (min 8 chars)
  - Backend: `PUT /api/users/me/password`

- [x] **Password Reset Flow**
  - "Forgot password?" link on login page
  - Backend: Generate reset token, store with 1-hour expiry
  - Reset token logged to console (no email service yet)
  - Frontend: `/forgot-password` and `/reset-password` pages
  - Migration: `V13__add_password_reset_fields.sql`

### Phase 2: Delete Account ✅
- [x] **Delete Account** (on profile page, "Danger Zone" section)
  - Confirmation dialog with password re-entry
  - Cascade deletes all user data (gardens, grow areas, etc.)
  - Backend: `DELETE /api/users/me`

---

## Files Created/Modified

### Backend
```
src/main/kotlin/no/sogn/gardentime/
├── api/
│   ├── AuthController.kt          # Added forgot/reset password endpoints
│   └── UserController.kt          # NEW: /api/users/me endpoints
├── dto/
│   ├── AuthDto.kt                 # Added ForgotPasswordRequest, ResetPasswordRequest
│   └── UserDto.kt                 # NEW: UserProfileResponse, UpdateProfileRequest, etc.
├── service/
│   ├── AuthService.kt             # Added forgotPassword, resetPassword methods
│   └── UserService.kt             # NEW: Profile operations
├── db/
│   └── UserRepository.kt          # Added findByPasswordResetToken
└── model/
    └── User.kt                    # Added passwordResetToken, passwordResetTokenExpiry fields

src/main/resources/db/migration/
└── V13__add_password_reset_fields.sql  # NEW: Migration for reset token fields
```

### Frontend
```
client-next/
├── app/
│   ├── profile/
│   │   └── page.tsx               # NEW: User profile page
│   ├── forgot-password/
│   │   └── page.tsx               # NEW: Forgot password page
│   ├── reset-password/
│   │   └── page.tsx               # NEW: Reset password page
│   └── login/
│       └── page.tsx               # Added "Forgot password?" link
├── app/api/
│   ├── users/me/
│   │   ├── route.ts               # NEW: BFF for profile (GET/PUT/DELETE)
│   │   └── password/
│   │       └── route.ts           # NEW: BFF for change password
│   └── auth/
│       ├── forgot-password/
│       │   └── route.ts           # NEW: BFF for forgot password
│       └── reset-password/
│           └── route.ts           # NEW: BFF for reset password
├── app/components/
│   └── Navbar.tsx                 # Changed "Welcome, username" to link to /profile
└── lib/
    └── api.ts                     # Added userService with profile/password/delete methods
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update profile (firstName, lastName) |
| PUT | `/api/users/me/password` | Change password (requires currentPassword) |
| DELETE | `/api/users/me` | Delete account (requires password confirmation) |
| POST | `/api/auth/forgot-password` | Request password reset (email) |
| POST | `/api/auth/reset-password` | Reset password with token |

---

## Usage

### Password Reset Flow
1. User clicks "Forgot password?" on login page
2. User enters email on `/forgot-password`
3. Check server console for reset token (logged in development)
4. Navigate to `/reset-password?token=<TOKEN>`
5. Enter new password

### Delete Account
1. Go to `/profile`
2. Scroll to "Danger Zone" section
3. Click "Delete Account"
4. Enter password to confirm
5. Account and all data permanently deleted

---

## Future Considerations (Not Implemented)
- [ ] Email service for password reset emails
- [ ] Email verification on registration
- [ ] Admin user management (list/disable users)
- [ ] Social login (Google, GitHub)
- [ ] Make test user creation optional via config
