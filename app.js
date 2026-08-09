document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch the batch user list to build the menu
    fetchUsers();
});

async function fetchUsers() {
    const listContainer = document.getElementById('userList');
    
    try {
        // Replicating Script 1 logic: Fetch the list of users
        const response = await fetch('https://api.luduvo.com/users?limit=100&offset=0');
        
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const data = await response.json();
        const users = data.users || [];
        
        listContainer.innerHTML = ''; // Clear loading text
        
        if (users.length === 0) {
            listContainer.innerHTML = '<div class="loading">No users found.</div>';
            return;
        }

        // Build the menu UI
        users.forEach(user => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'user-item';
            
            // Check for banned role to apply gray tint
            const isBanned = typeof user.role === 'string' && user.role.toLowerCase().includes('banned');
            if (isBanned) {
                itemDiv.classList.add('banned');
            }

            // Populate text
            const displayName = user.display_name || user.username || "Unknown User";
            itemDiv.innerHTML = `
                <div class="user-name">${displayName}</div>
                <div class="user-handle">@${user.username || "unknown"} (ID: ${user.id})</div>
            `;

            // Add click event to open advanced view
            itemDiv.addEventListener('click', () => {
                loadAdvancedProfile(user, isBanned);
            });

            listContainer.appendChild(itemDiv);
        });

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = '<div class="loading">Error loading users.</div>';
    }
}

// 2. Fetch detailed profile when a menu item is clicked
async function loadAdvancedProfile(basicUser, isBanned) {
    const profileCard = document.getElementById('profileCard');
    const profileContent = document.getElementById('profileContent');
    const profileLoading = document.getElementById('profileLoading');

    // Show card and loading state
    profileCard.style.display = 'block';
    profileContent.style.display = 'none';
    profileLoading.style.display = 'block';

    try {
        // Replicating Script 2 logic: Fetch advanced profile stats
        const response = await fetch(`https://api.luduvo.com/users/${basicUser.id}/profile`);
        let advData = {};
        
        if (response.ok) {
            advData = await response.json();
        }

        // --- POPULATE UI ---

        // Basic Info
        document.getElementById('advName').textContent = basicUser.display_name || basicUser.username;
        document.getElementById('advHandle').textContent = `@${basicUser.username}`;

        // Status Badge
        const statusBadge = document.getElementById('advStatus');
        if (isBanned) {
            statusBadge.textContent = 'BANNED';
            statusBadge.className = 'status-badge banned';
        } else {
            statusBadge.textContent = 'ACTIVE';
            statusBadge.className = 'status-badge';
        }

        // Formatted Join Date
        let joinText = "Unknown";
        if (advData.member_since || basicUser.created_at) {
            const timestamp = advData.member_since || basicUser.created_at;
            const joinDate = new Date(timestamp * 1000);
            joinText = joinDate.toLocaleDateString() + ' ' + joinDate.toLocaleTimeString();
        }
        document.getElementById('advJoin').textContent = joinText;

        // Last Active Logic (Replicating your exact script math)
        let activeText = "Unknown";
        if (advData.last_active) {
            const daysSince = Math.floor(
                (Date.now() - new Date(advData.last_active * 1000)) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSince <= 0) {
                activeText = "Recently Online";
            } else if (daysSince === 1) {
                activeText = "1 day ago";
            } else {
                activeText = `${daysSince} days ago`;
            }
        }
        document.getElementById('advActive').textContent = activeText;

        // Counts
        document.getElementById('advFriends').textContent = advData.friend_count ?? 0;
        document.getElementById('advPlaces').textContent = advData.place_count ?? 0;
        document.getElementById('advItems').textContent = advData.item_count ?? 0;

        // Hide loading, show content
        profileLoading.style.display = 'none';
        profileContent.style.display = 'block';

    } catch (error) {
        console.error("Error fetching profile:", error);
        profileLoading.textContent = "Error loading profile data.";
    }
}
