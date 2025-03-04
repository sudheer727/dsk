document.addEventListener("DOMContentLoaded", loadVehicles);
function loadVehicles() {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    
    if (users.length === 0) {
        document.getElementById("vehicleList").innerHTML = "<p>No vehicles found.</p>";
        return;
    }

    updateAvailability(users);
    removeExpiredRequests(users);
    displayVehicles(users);
}

// ✅ Update vehicle availability based on bookings
function updateAvailability(users) {
    let now = new Date();
    let next24hrs = new Date();
    next24hrs.setHours(next24hrs.getHours() + 24);

    users.forEach(user => {
        let isBooked = user.confirmedBookings?.some(req => {
            let bookingTime = new Date(`${req.date}T${req.startTime}`);
            return bookingTime >= now && bookingTime <= next24hrs;
        });

        user.available = !isBooked;
    });

    localStorage.setItem("users", JSON.stringify(users));
}

// ✅ Remove expired booking requests (older than 10 minutes)
function removeExpiredRequests(users) {
    let now = new Date();
    users.forEach(user => {
        if (!user.bookingRequests) return;
        user.bookingRequests = user.bookingRequests.filter(req => {
            let requestTime = new Date(req.timestamp);
            return (now - requestTime) / 60000 < 10; // Keep requests within 10 min
        });
    });

    localStorage.setItem("users", JSON.stringify(users));
}

// ✅ Request a booking
function requestBooking(ownerName) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let userIndex = users.findIndex(u => u.username === ownerName);

    if (userIndex === -1) {
        alert("Owner not found!");
        return;
    }

    // Find the booking form for the specific owner using username
    let bookingForm = document.getElementById(`booking-form-${ownerName}`);
    if (!bookingForm) {
        alert("Booking form not found!");
        return;
    }

    // Retrieve input values from the form
    let name = document.getElementById(`booking-name-${ownerName}`)?.value.trim();
    let date = document.getElementById(`booking-date-${ownerName}`)?.value;
    let startTime = document.getElementById(`booking-start-time-${ownerName}`)?.value;
    let endTime = document.getElementById(`booking-end-time-${ownerName}`)?.value;

    if (!name || !date || !startTime || !endTime) {
        alert("Please fill all booking details.");
        return;
    }

    let newRequest = {
        name,
        date,
        startTime,
        endTime,
        timestamp: new Date().toISOString()
    };

    // Prevent duplicate booking requests
    if (users[userIndex].bookingRequests?.some(req => req.name === name && req.date === date)) {
        alert("You have already requested a booking for this date!");
        return;
    }

    users[userIndex].bookingRequests = users[userIndex].bookingRequests || [];
    users[userIndex].bookingRequests.push(newRequest);

    localStorage.setItem("users", JSON.stringify(users));

    alert("Booking request sent!");
    loadVehicles(); // Refresh the UI
}// ✅ Confirm a booking
function confirmBooking(ownerName, requesterName) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let userIndex = users.findIndex(u => u.username === ownerName);

    if (userIndex === -1) {
        alert("Owner not found!");
        return;
    }

    let owner = users[userIndex];

    let enteredPassword = prompt("Enter your password to confirm this booking:");
    if (enteredPassword !== owner.password) {
        alert("Incorrect password.");
        return;
    }

    let requestIndex = owner.bookingRequests.findIndex(req => req.name === requesterName);
    if (requestIndex === -1) {
        alert("Booking request not found.");
        return;
    }

    let confirmedBooking = owner.bookingRequests.splice(requestIndex, 1)[0];
    owner.confirmedBookings = owner.confirmedBookings || [];
    owner.confirmedBookings.push(confirmedBooking);

    users[userIndex] = owner; // Update the users array
    localStorage.setItem("users", JSON.stringify(users));
    alert("Booking confirmed!");
    loadVehicles();
}// ✅ Cancel a booking
function cancelBooking(ownerName, requesterName) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let userIndex = users.findIndex(u => u.username === ownerName);

    if (userIndex === -1) {
        alert("Owner not found!");
        return;
    }

    let owner = users[userIndex];

    let enteredPassword = prompt("Enter your password to cancel this booking:");
    if (enteredPassword !== owner.password) {
        alert("Incorrect password.");
        return;
    }

    let requestIndex = owner.bookingRequests.findIndex(req => req.name === requesterName);
    if (requestIndex === -1) {
        alert("Booking request not found.");
        return;
    }

    owner.bookingRequests.splice(requestIndex, 1); // Remove request
    users[userIndex] = owner; // Update the users array
    localStorage.setItem("users", JSON.stringify(users));

    alert("Booking request canceled!");
    loadVehicles();
}// ✅ Delete Confirmed Booking (asks for password)
function deleteConfirmedBooking(ownerName, requesterName) {
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let userIndex = users.findIndex(u => u.username === ownerName);

    if (userIndex === -1) {
        alert("Owner not found!");
        return;
    }

    let owner = users[userIndex];

    let enteredPassword = prompt("Enter your password to delete this confirmed booking:");
    if (enteredPassword !== owner.password) {
        alert("Incorrect password. Cannot delete booking.");
        return;
    }

    let bookingIndex = owner.confirmedBookings.findIndex(req => req.name === requesterName);
    if (bookingIndex === -1) {
        alert("Booking not found.");
        return;
    }

    owner.confirmedBookings.splice(bookingIndex, 1); // Remove confirmed booking
    users[userIndex] = owner; // Update the users array
    localStorage.setItem("users", JSON.stringify(users));

    alert("Confirmed booking deleted!");
    loadVehicles(); // Refresh UI
}// ✅ Display vehicles dynamically
function displayVehicles(users) {
    let vehicleList = document.getElementById("vehicleList");
    vehicleList.innerHTML = "";

    if (users.length === 0) {
        vehicleList.innerHTML = "<p>No vehicles found.</p>";
        return;
    }

    users.sort((a, b) => b.available - a.available); // Sort available first

    users.forEach((user) => {
        let div = document.createElement("div");
        div.className = "vehicle-entry";
        div.innerHTML = `
            <p>
                <strong class="owner-name">${user.username}</strong> 
                <span id="status-${user.username}" class="${user.available ? 'green' : 'red'}">⬤</span> |
                <a href="tel:${user.phone}"><button>Call</button></a>
                <button onclick="showBookingForm('${user.username}')">Book</button>
            </p>

            <div id="booking-form-${user.username}" class="hidden">
                <input type="text" id="booking-name-${user.username}" placeholder="Enter Your Name">
                <input type="date" id="booking-date-${user.username}">
                <input type="time" id="booking-start-time-${user.username}">
                <input type="time" id="booking-end-time-${user.username}">
                
                <button onclick="requestBooking('${user.username}')">Request</button>
            </div>

            <p><strong>Booking Requests:</strong></p>
            <ul id="request-list-${user.username}">
                ${user.bookingRequests && user.bookingRequests.length > 0 ? 
                    user.bookingRequests.map(req => `
                        <li>
                            ${req.name}, ${req.date} (${getDay(req.date)}), ${req.startTime} - ${req.endTime} 
                            <button onclick="confirmBooking('${user.username}', '${req.name}')">Confirm</button>
                            <button onclick="cancelBooking('${user.username}', '${req.name}')">Cancel</button>
                        </li>
                    `).join('') : "<li>No booking requests yet.</li>"
                }
            </ul>

            <p><strong>Confirmed Bookings:</strong> </p>
            <ul id="confirmed-list-${user.username}">
                ${user.confirmedBookings && user.confirmedBookings.length > 0 ? 
                    user.confirmedBookings.map(req => `
                        <li>
                            ${req.name}, ${req.date} (${getDay(req.date)}), ${req.startTime} - ${req.endTime} ✅ 
                            <button onclick="deleteConfirmedBooking('${user.username}', '${req.name}')">Delete</button>
                        </li>
                    `).join('') : "<li>No confirmed bookings yet.</li>"
                }
            </ul>
        `;
        vehicleList.appendChild(div);
    });
}// ✅ Get the day of the week for a given date
function getDay(dateString) {
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "Invalid Date";
    }
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}// ✅ Filter vehicles
function filterVehicles() {
    let nameInput = document.getElementById("searchInput").value.toLowerCase();
    let dateInput = document.getElementById("searchDate").value;
    let startTimeInput = document.getElementById("searchStartTime").value;
    let endTimeInput = document.getElementById("searchEndTime").value;
    let users = JSON.parse(localStorage.getItem("users")) || [];

    let filteredUsers = users.filter(user => {
        let matchesName = nameInput ? user.username.toLowerCase().includes(nameInput) : true;
        let matchesDate = true;
        let matchesTime = true;

        if (dateInput) {
            matchesDate = !user.confirmedBookings?.some(req => req.date === dateInput);
        }

        if (dateInput && (startTimeInput || endTimeInput)) {
            matchesTime = user.confirmedBookings?.every(req => {
                if (req.date !== dateInput) return true;
                let bookingStart = new Date(`${req.date}T${req.startTime}`);
                let bookingEnd = new Date(`${req.date}T${req.endTime}`);
                let searchStart = startTimeInput ? new Date(`${dateInput}T${startTimeInput}`) : null;
                let searchEnd = endTimeInput ? new Date(`${dateInput}T${endTimeInput}`) : null;

                return (searchEnd && searchEnd <= bookingStart) || (searchStart && searchStart >= bookingEnd);
            }) ?? true;
        }

        return matchesName && matchesDate && matchesTime;
    });

    displayVehicles(filteredUsers);
}
// ✅ Register a new vehicle
function registerUser() {
    let username = document.getElementById("reg-username").value.trim();
    let password = document.getElementById("reg-password").value.trim();
    let countryCode = document.getElementById("reg-countryCode").value;
    let phone = document.getElementById("reg-phone").value.trim();
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Validate unique username
    if (users.some(u => u.username === username)) {
        alert("Username already exists! Choose a different username.");
        return;
    }

    // Validate phone number length based on country code
    let phoneLengths = {
        "+91": 10, // India
        "+1": 10,  // USA
        "+44": 10, // UK
        "+61": 9,  // Australia
        "+81": 10, // Japan
        "+49": 11  // Germany
    };

    if (!/^\d+$/.test(phone)) {
        alert("Phone number should contain only numbers!");
        return;
    }

    if (phone.length !== phoneLengths[countryCode]) {
        alert(`Invalid phone number! It should be ${phoneLengths[countryCode]} digits long for ${countryCode}.`);
        return;
    }

    // Save user
    users.push({ username, password, phone: countryCode + phone });
    localStorage.setItem("users", JSON.stringify(users));
    
    alert("Registration Successful!");
    window.location.href = "main.html"; // Redirect to main page
}
// ✅ Delete Profile Function
function deleteProfile() {
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();
    let users = JSON.parse(localStorage.getItem("users")) || [];

    let userIndex = users.findIndex(u => u.username === username && u.password === password);

    if (userIndex !== -1) {
        if (confirm("Are you sure you want to delete your profile? This cannot be undone.")) {
            // Remove user's bookings and requests from other users' lists
            users.forEach(user => {
                user.bookingRequests = user.bookingRequests?.filter(req => req.name !== username);
                user.confirmedBookings = user.confirmedBookings?.filter(req => req.name !== username);
            });

            users.splice(userIndex, 1); // Remove user from array
            localStorage.setItem("users", JSON.stringify(users)); // Save changes
            alert("Profile deleted successfully!");
            window.location.href = "main.html"; // Redirect to main page
        }
    } else {
        alert("Invalid username or password!");
    }
}
//function updateDetails
function updateDetails() {
    let newUsername = document.getElementById("newUsername").value.trim();
    let newPassword = document.getElementById("newPassword").value.trim();
    let countryCode = document.getElementById("countryCode").value;
    let newPhone = document.getElementById("phone").value.trim();

    let phoneLengths = { "+91": 10, "+1": 10, "+44": 10, "+61": 9, "+81": 10, "+49": 11 };
    if (!/^\d+$/.test(newPhone) || newPhone.length !== phoneLengths[countryCode]) {
        alert(`Invalid phone number for ${countryCode}!`);
        return;
    }

    let fullPhone = countryCode + newPhone;

    let users = JSON.parse(localStorage.getItem("users")) || [];
    let username = document.getElementById("username").value.trim(); // Get username from input

    let userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        alert("User not found!");
        return;
    }

    // Validate new username uniqueness
    if (users.some(u => u.username === newUsername && u.username !== username)) {
        alert("Username already exists! Choose a different username.");
        return;
    }

    // Update user details
    users[userIndex].username = newUsername;
    users[userIndex].password = newPassword;
    users[userIndex].phone = fullPhone;

    // Update username inside bookingRequests and confirmedBookings
    users.forEach(user => {
        user.bookingRequests = user.bookingRequests?.map(req => req.name === username ? { ...req, name: newUsername } : req);
        user.confirmedBookings = user.confirmedBookings?.map(req => req.name === username ? { ...req, name: newUsername } : req);
    });

    localStorage.setItem("users", JSON.stringify(users));
    alert("Details Updated Successfully!");
    window.location.href = "main.html";


//showBookingForm(username) 
function showBookingForm(username) {
    let bookingForm = document.getElementById(`booking-form-${username}`);
    if (bookingForm) {
        bookingForm.classList.toggle("hidden");
    }
}
}
