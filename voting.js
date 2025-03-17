document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const positionSelect = document.getElementById('positionSelect');
    const candidatesList = document.getElementById('candidatesList');
    const voteBtn = document.getElementById('voteBtn');
    const nextPositionBtn = document.getElementById('nextPositionBtn');
    const finishBtn = document.getElementById('finishBtn');
    const messageDiv = document.getElementById('message');
    const displayStudentId = document.getElementById('displayStudentId');
    const displayStudentName = document.getElementById('displayStudentName');

    // Get student info from session storage
    const currentStudent = JSON.parse(sessionStorage.getItem('currentStudent'));
    if (!currentStudent) {
        window.location.href = 'index.html';
        return;
    }

    // Display student ID and name
    displayStudentId.textContent = currentStudent.id;
    displayStudentName.textContent = currentStudent.name;

    // Track voted positions
    let votedPositions = [];
    let selectedCandidate = null;
    let positions = [];

    // Load positions from localStorage or fetch from JSON
    const storedPositions = JSON.parse(localStorage.getItem('positions'));
    if (storedPositions) {
        positions = storedPositions;
        populatePositionDropdown();
    } else {
        loadPositionsFromJSON();
    }

    // Event listeners
    positionSelect.addEventListener('change', loadCandidates);
    voteBtn.addEventListener('click', submitVote);
    nextPositionBtn.addEventListener('click', resetForNextPosition);
    finishBtn.addEventListener('click', finishVoting);

    function loadPositionsFromJSON() {
        fetch('positions.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch positions data');
                }
                return response.json();
            })
            .then(data => {
                positions = data.positions;
                localStorage.setItem('positions', JSON.stringify(positions));
                populatePositionDropdown();
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('An error occurred while loading positions.', 'error');
            });
    }

    function populatePositionDropdown() {
        // Clear existing options except the default one
        while (positionSelect.options.length > 1) {
            positionSelect.remove(1);
        }
        
        // Populate position dropdown
        positions.forEach(position => {
            const option = document.createElement('option');
            option.value = position.id;
            option.textContent = position.title;
            positionSelect.appendChild(option);
        });
    }

    function loadCandidates() {
        const positionId = positionSelect.value;
        
        if (!positionId) {
            candidatesList.innerHTML = '';
            voteBtn.disabled = true;
            return;
        }

        // Check if already voted for this position
        if (votedPositions.includes(positionId)) {
            showMessage('You have already voted for this position.', 'error');
            candidatesList.innerHTML = '';
            voteBtn.disabled = true;
            return;
        }

        const position = positions.find(p => p.id === positionId);
        if (!position) return;

        candidatesList.innerHTML = '';
        selectedCandidate = null;
        voteBtn.disabled = true;

        position.candidates.forEach(candidate => {
            const candidateCard = document.createElement('div');
            candidateCard.className = 'candidate-card';
            candidateCard.dataset.id = candidate.id;
            candidateCard.innerHTML = `
                <h3>${candidate.name}</h3>
                <p>${candidate.description}</p>
            `;
            
            candidateCard.addEventListener('click', function() {
                // Remove selected class from all candidates
                document.querySelectorAll('.candidate-card').forEach(card => {
                    card.classList.remove('selected');
                });
                
                // Add selected class to clicked candidate
                this.classList.add('selected');
                
                // Store selected candidate
                selectedCandidate = candidate;
                
                // Enable vote button
                voteBtn.disabled = false;
            });
            
            candidatesList.appendChild(candidateCard);
        });
    }

    function submitVote() {
        if (!selectedCandidate) return;
        
        const positionId = positionSelect.value;
        const position = positions.find(p => p.id === positionId);
        
        // Create vote object
        const vote = {
            studentId: currentStudent.id,
            positionId: positionId,
            positionTitle: position.title,
            candidateId: selectedCandidate.id,
            candidateName: selectedCandidate.name,
            timestamp: new Date().toISOString()
        };
        
        // Save vote to localStorage
        saveVote(vote);
        
        // Add position to voted positions
        votedPositions.push(positionId);
        
        // Disable vote button and enable next position button
        voteBtn.disabled = true;
        nextPositionBtn.disabled = false;
        
        showMessage(`Vote for ${position.title} submitted successfully!`, 'success');
    }

    function saveVote(vote) {
        // Get existing votes from localStorage
        let votes = JSON.parse(localStorage.getItem('votes')) || [];
        votes.push(vote);
        localStorage.setItem('votes', JSON.stringify(votes));
        
        // Update student's hasVoted status if all positions are voted
        if (votedPositions.length === positions.length) {
            updateStudentVoteStatus();
        }
    }
    
    function updateStudentVoteStatus() {
        let students = JSON.parse(localStorage.getItem('students')) || [];
        const studentIndex = students.findIndex(s => s.id === currentStudent.id);
        if (studentIndex !== -1) {
            students[studentIndex].hasVoted = true;
            localStorage.setItem('students', JSON.stringify(students));
            
            // Update session storage as well
            currentStudent.hasVoted = true;
            sessionStorage.setItem('currentStudent', JSON.stringify(currentStudent));
        }
    }

    function resetForNextPosition() {
        // Reset selection
        selectedCandidate = null;
        
        // Clear candidates list
        candidatesList.innerHTML = '';
        
        // Reset position select
        positionSelect.value = '';
        
        // Disable buttons
        voteBtn.disabled = true;
        nextPositionBtn.disabled = true;
        
        // Clear message
        messageDiv.innerHTML = '';
        messageDiv.className = 'message';
    }

    // In the voting.js file, find the finishVoting function and update it:
    
    function finishVoting() {
        // Check if at least one position was voted for
        if (votedPositions.length === 0) {
            showMessage('Please vote for at least one position before finishing.', 'error');
            return;
        }
        
        // Update student's hasVoted status
        updateStudentVoteStatus();
        
        // Redirect to thank you page instead of results page
        window.location.href = 'thank-you.html';
    }

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
    }
});