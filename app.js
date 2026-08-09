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
                loadAdvancedProfile(user);
            });

            listContainer.appendChild(itemDiv);
        });

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = '<div class="loading">Error loading users. Check console.</div>';
    }
}

// Fetch detailed profile when a menu item is clicked
async function loadAdvancedProfile(basicUser) {
    const profileCard = document.getElementById('profileCard');
    const profileContent = document.getElementById('profileContent');
    const profileLoading = document.getElementById('profileLoading');

    // Show card and loading state
    profileCard.style.display = 'block';
    profileContent.style.display = 'none';
    profileLoading.style.display = 'block';

    try {
        const response = await fetch(`https://corsproxy.io/?https://api.luduvo.com/users/${basicUser.id}/profile`);
        let advData = {};
        
        if (response.ok) {
            advData = await response.json();
        }

        // --- POPULATE UI ---
        document.getElementById('advName').textContent = `${basicUser.display_name || basicUser.username} (#${basicUser.id})`;
        document.getElementById('advHandle').textContent = `@${basicUser.username}`;

        // Formatted Join Date
        let joinText = "Unknown";
        if (advData.member_since || basicUser.created_at) {
            const timestamp = advData.member_since || basicUser.created_at;
            const joinDate = new Date(timestamp * 1000);
            joinText = joinDate.toLocaleDateString() + ' ' + joinDate.toLocaleTimeString();
        }
        document.getElementById('advJoin').textContent = joinText;

        // Last Active Logic 
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
