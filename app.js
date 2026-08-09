document.addEventListener('DOMContentLoaded', () => {
    fetchAllUsers();
});
//uh idk
async function fetchAllUsers() {
    const listContainer = document.getElementById('userList');
    listContainer.innerHTML = '<div class="loading" id="loadingText">Loading users...</div>';
    const loadingText = document.getElementById('loadingText');
    
    let allUsers = [];
    let current_offset = 0;
    let keepFetching = true;

    try {
        // --- PAGINATION LOOP ---
        while (keepFetching) {
            loadingText.textContent = `Fetching users... (${allUsers.length} loaded)`;
            
            const response = await fetch(`https://corsproxy.io/?https://api.luduvo.com/users?limit=100&offset=${current_offset}`);
            
            if (!response.ok) {
                console.error("API failed with status:", response.status);
                keepFetching = false;
                break;
            }
            
            const data = await response.json();
            const users = data.users || [];
            
            if (users.length === 0) {
                keepFetching = false;
                break;
            }

            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                allUsers.push(user);
                
                // Stop condition based on ID
                if (Number(user.id) <= 1) {
                    keepFetching = false;
                }
            }
            
            current_offset += 100;
            
            // Short pause to prevent API rate limiting
            await new Promise(resolve => setTimeout(resolve, 200)); 
        }

        // Clear the loading text once done
        listContainer.innerHTML = ''; 

        if (allUsers.length === 0) {
            listContainer.innerHTML = '<div class="loading">No users found.</div>';
            return;
        }

        // --- RENDER MENU ---
        allUsers.forEach(user => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'user-item';

            const displayName = user.display_name || user.username || "Unknown User";
            
            itemDiv.innerHTML = `
                <div class="user-name">${displayName} (#${user.id})</div>
                <div class="user-handle">@${user.username || "unknown"}</div>
            `;

            // Click listener for the advanced view
            itemDiv.addEventListener('click', () => {
                LoadUserProfile(user);
            });

            listContainer.appendChild(itemDiv);
        });

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = '<div class="loading">Error loading users. Check console.</div>';
    }
}

// Fetch detailed profile when a menu item is clicked
async function LoadUserProfile(basicUser) {
    const profileCard = document.getElementById('profileCard');
    const profileContent = document.getElementById('profileContent');
    const profileLoading = document.getElementById('profileLoading');

    // Show card and loading state
    profileCard.style.display = 'block';
    profileContent.style.display = 'none';
    profileLoading.style.display = 'block';

    try {
        const response = await fetch(`https://corsproxy.io/?https://api.luduvo.com/users/${basicUser.id}/profile`);
        let userData = {};
        
        if (response.ok) {
            userData = await response.json();
        }

        // --- POPULATE UI ---
        document.getElementById('userName').textContent = `${basicUser.display_name || basicUser.username} (#${basicUser.id})`;
        document.getElementById('userHandle').textContent = `@${basicUser.username}`;

        // --- ROLE BADGE LOGIC ---
        const statusBadge = document.getElementById('userStatus');
        const userRole = userData.role || basicUser.role || "Unknown"; 
        
        statusBadge.textContent = userRole;

        // Style the badge based on whether they are banned or have a special role
        if (typeof userRole === "string" && userRole.toLowerCase().includes("admin")) {
            statusBadge.className = 'status-badge admin';
        } else {
            statusBadge.className = 'status-badge';
        }

        // Formatted Join Date
        let joinText = "Unknown";
        if (userData.member_since || basicUser.created_at) {
            const timestamp = userData.member_since || basicUser.created_at;
            const joinDate = new Date(timestamp * 1000);
            joinText = joinDate.toLocaleDateString() + ' ' + joinDate.toLocaleTimeString();
        }
        document.getElementById('userJoin').textContent = joinText;

        let activeText = "Unknown";
        if (userData.last_active) {
            const diffMs = Date.now() - new Date(userData.last_active * 1000);
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 60) {
                activeText = diffMins <= 1 ? "1 minute ago" : `${diffMins} minutes ago`;
            } else if (diffHours < 24) {
                activeText = diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
            } else if (diffDays === 1) {
                activeText = "1 day ago";
            } else if (diffDays < 30) {
                activeText = `${diffDays} days ago`;
            } else {
                activeText = "Recently Online"; // Or keep your preferred fallback for older dates
            }
        }
        document.getElementById('userActive').textContent = activeText;

        // Counts
        document.getElementById('userFriends').textContent = userData.friend_count ?? 0;
        document.getElementById('userPlaces').textContent = userData.place_count ?? 0;
        document.getElementById('userItems').textContent = userData.item_count ?? 0;

        // Hide loading, show content
        profileLoading.style.display = 'none';
        profileContent.style.display = 'block';

    } catch (error) {
        console.error("Error fetching profile:", error);
        profileLoading.textContent = "Error loading profile data.";
    }
}
