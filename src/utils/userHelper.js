/**
 * Helper utilities for resolving and displaying creator / user information
 */

export const getLoggedInUser = () => {
  let userObj = null;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
    if (raw && raw !== "undefined" && raw !== "null") {
      userObj = JSON.parse(raw);
    }
  } catch (e) {}

  // If user object is missing id/_id, decode from JWT token safely
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (token && typeof token === 'string') {
      const parts = token.split(".");
      if (parts.length === 3) {
        // Safe base64url decode
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const decoded = JSON.parse(atob(padded));
        const tokenId = decoded?._id || decoded?.id || decoded?.userId;
        if (tokenId) {
          if (!userObj || typeof userObj !== 'object') userObj = {};
          if (!userObj._id) userObj._id = tokenId;
          if (!userObj.id) userObj.id = tokenId;
        }
      }
    }
  } catch (e) {}

  return userObj && typeof userObj === 'object' ? userObj : null;
};

export const getLoggedInUserId = () => {
  const user = getLoggedInUser();
  return user?._id || user?.id || null;
};

export const getInitials = (text = '') => {
  try {
    if (!text) return 'U';
    const str = String(text).trim();
    if (!str) return 'U';
    const parts = str.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  } catch {
    return 'U';
  }
};

export const getCreatorInfo = (createdBy) => {
  try {
    const loggedIn = getLoggedInUser();

    if (!createdBy) {
      return {
        name: "System / Unassigned",
        email: "",
        initials: "SYS",
        isKnown: false,
      };
    }

    // If createdBy is populated as an object
    if (typeof createdBy === "object") {
      const id = createdBy._id || createdBy.id;
      const isCurrentUser =
        loggedIn && id && (String(loggedIn._id || loggedIn.id) === String(id));

      const name =
        createdBy.name ||
        createdBy.username ||
        (createdBy.email ? String(createdBy.email).split("@")[0] : "");
      const email = createdBy.email ? String(createdBy.email) : "";

      if (name) {
        return {
          name: isCurrentUser ? `${name} (You)` : String(name),
          email,
          initials: getInitials(name),
          isKnown: true,
        };
      }

      if (isCurrentUser) {
        return {
          name: `${loggedIn.name || "Current User"} (You)`,
          email: loggedIn.email || "",
          initials: getInitials(loggedIn.name || "U"),
          isKnown: true,
        };
      }

      if (id) {
        return {
          name: `User #${String(id).slice(-4)}`,
          email: "",
          initials: "U",
          isKnown: true,
        };
      }
    }

    // If createdBy is a string (e.g. raw ObjectId or name)
    if (typeof createdBy === "string") {
      const strVal = createdBy.trim();
      const isCurrentUser =
        loggedIn && (String(loggedIn._id || loggedIn.id) === strVal);

      if (isCurrentUser) {
        return {
          name: `${loggedIn.name || "Current User"} (You)`,
          email: loggedIn.email || "",
          initials: getInitials(loggedIn.name || "U"),
          isKnown: true,
        };
      }

      // Check if it looks like a Mongo ObjectId (24 hex characters)
      if (/^[0-9a-fA-F]{24}$/.test(strVal)) {
        return {
          name: `User #${strVal.slice(-4)}`,
          email: "",
          initials: "U",
          isKnown: true,
        };
      }

      return {
        name: strVal,
        email: "",
        initials: getInitials(strVal),
        isKnown: true,
      };
    }

    return {
      name: "System",
      email: "",
      initials: "SYS",
      isKnown: false,
    };
  } catch (err) {
    console.warn("getCreatorInfo error:", err);
    return {
      name: "System",
      email: "",
      initials: "SYS",
      isKnown: false,
    };
  }
};
