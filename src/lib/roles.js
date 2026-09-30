/**
 * Who is who. "owner" is the single site owner, "admin" is a staff member the owner approved,
 * anyone else is a customer. These only control what the screens SHOW; the server decides
 * what is actually allowed on every request.
 */
export const isStaff = (user) => user?.role === "admin" || user?.role === "owner";
export const isOwner = (user) => user?.role === "owner";
export const roleLabel = (user) => (user?.role === "owner" ? "Site owner" : user?.role === "admin" ? "Admin" : "Customer");
