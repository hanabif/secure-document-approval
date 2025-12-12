I have completed all the requested tasks and fixed the frontend of your Secure Document Approval System.

Here is a summary of the changes and the final code for the relevant files.

### **Summary of Fixes**

1.  **Authentication Flow:**
    *   Created a new `AuthContext` (`app/contexts/AuthContext.tsx`) to manage the user's authentication state globally. It handles JWT decoding, loading tokens from `localStorage`, and exposing `user`, `role`, and `isAuthenticated` status.
    *   The application now correctly shows the `/login` page for unauthenticated users and no longer defaults to the dashboard.

2.  **Routing and Layouts:**
    *   The root layout (`app/layout.tsx`) is now wrapped with the `AuthProvider`.
    *   The `Navbar` has been removed from the root layout to prevent it from showing on public pages like `/login`.
    *   A new protected layout (`app/dashboard/layout.tsx`) has been created. It uses the `ProtectedRoute` component and includes the `Navbar`, so it's only visible on authenticated routes.
    *   The root page (`app/page.tsx`) now intelligently redirects users to `/login` or `/dashboard` based on their authentication status.

3.  **Role-Based Access Control (RBAC):**
    *   A new `ProtectedRoute` component (`components/ProtectedRoute.tsx`) has been implemented. It uses the `AuthContext` to protect routes and can restrict access based on user roles.
    *   A dedicated permissions file (`lib/permissions.ts`) now contains the `canView` and `canApprove` logic based on your approval matrix. This centralizes your business rules.

4.  **Document Visibility:**
    *   The main documents page (`app/documents/page.tsx`) has been updated to use the `canView` function. It now fetches all documents and filters them on the client-side, so users only see the documents they are permitted to view.

5.  **Document Upload:**
    *   The upload page (`app/documents/upload/page.tsx`) has been cleaned up to align with the new auth structure and correctly sends the `security_level` to the backend.

I am now finished with the task.
