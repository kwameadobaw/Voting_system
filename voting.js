document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const positionSelect = document.getElementById('positionSelect');
    const candidatesList = document.getElementById('candidatesList');
    const voteBtn = document.getElementById('voteBtn');
    const finishBtn = document.getElementById('finishBtn');
    const messageDiv = document.getElementById('message');
    const displayStudentId = document.getElementById('displayStudentId');
    const displayStudentName = document.getElementById('displayStudentName');
    const positionTitle = document.getElementById('currentPositionTitle');
    const progressFill = document.getElementById('progressFill');
    const currentPositionNumber = document.getElementById('currentPositionNumber');
    const totalPositionsSpan = document.getElementById('totalPositions');

    // Get student info from session storage
    const currentStudent = JSON.parse(sessionStorage.getItem('currentStudent'));
    if (!currentStudent) {
        window.location.href = 'index.html';
        return;
    }

    // Display student ID and name
    displayStudentId.textContent = currentStudent.id;
    displayStudentName.textContent = currentStudent.name;

    // Track voted positions and current position index
    let votedPositions = [];
    let selectedCandidate = null;
    let positions = [];
    let currentPositionIndex = 0;

    // Load positions from localStorage or fetch from JSON
    const storedPositions = JSON.parse(localStorage.getItem('positions'));
    if (storedPositions) {
        positions = storedPositions;
        loadCurrentPosition();
    } else {
        loadPositionsFromJSON();
    }

    // Event listeners
    voteBtn.addEventListener('click', submitVoteAndMoveNext);
    finishBtn.addEventListener('click', finishVoting);

    // Initially disable finish button until all positions are voted for
    finishBtn.disabled = true;

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
                
                // Update total positions count
                totalPositionsSpan.textContent = positions.length;
                
                loadCurrentPosition();
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('An error occurred while loading positions.', 'error');
            });
    }

    function loadCurrentPosition() {
        // Hide position select dropdown since we're showing positions in order
        document.querySelector('.position-selection').style.display = 'none';
        
        // Update total positions count
        totalPositionsSpan.textContent = positions.length;
        
        if (currentPositionIndex >= positions.length) {
            // All positions have been voted on
            showMessage('You have voted for all positions. Click "Finish Voting" to submit.', 'success');
            voteBtn.disabled = true;
            
            // Only enable finish button if all positions have been voted for
            finishBtn.disabled = votedPositions.length < positions.length;
            
            return;
        }
        
        const position = positions[currentPositionIndex];
        
        // Check if already voted for this position
        if (votedPositions.includes(position.id)) {
            // Skip this position
            currentPositionIndex++;
            loadCurrentPosition();
            return;
        }
        
        // Update position title
        positionTitle.textContent = position.title;
        
        // Update progress indicators
        currentPositionNumber.textContent = currentPositionIndex + 1;
        const progressPercentage = (currentPositionIndex / positions.length) * 100;
        progressFill.style.width = `${progressPercentage}%`;
        
        // Load candidates for current position
        loadCandidatesForPosition(position);
        
        // Update button states
        voteBtn.disabled = true;
        
        // Disable finish button until all positions are voted for
        finishBtn.disabled = true;
    }

    function loadCandidatesForPosition(position) {
        candidatesList.innerHTML = '';
        selectedCandidate = null;

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

    function submitVoteAndMoveNext() {
        if (!selectedCandidate) return;
        
        const position = positions[currentPositionIndex];
        
        // Create vote object
        const vote = {
            studentId: currentStudent.id,
            positionId: position.id,
            positionTitle: position.title,
            candidateId: selectedCandidate.id,
            candidateName: selectedCandidate.name,
            timestamp: new Date().toISOString()
        };
        
        // Save vote to localStorage
        saveVote(vote);
        
        // Add position to voted positions
        votedPositions.push(position.id);
        
        // Disable vote button
        voteBtn.disabled = true;
        
        showMessage(`Vote for ${position.title} submitted successfully!`, 'success');
        
        // Move to next position automatically
        setTimeout(() => {
            currentPositionIndex++;
            loadCurrentPosition();
            
            // Reset selection
            selectedCandidate = null;
            
            // Check if all positions have been voted for
            if (currentPositionIndex >= positions.length) {
                // Enable finish button only if all positions have been voted for
                finishBtn.disabled = votedPositions.length < positions.length;
                showMessage('You have voted for all positions. Click "Finish Voting" to submit.', 'success');
            }
            
            // Update progress indicators
            const progressPercentage = ((votedPositions.length) / positions.length) * 100;
            progressFill.style.width = `${progressPercentage}%`;
        }, 1000); // Short delay before moving to next position
    }

    function saveVote(vote) {
        // Get existing votes from localStorage
        let votes = JSON.parse(localStorage.getItem('votes')) || [];
        votes.push(vote);
        localStorage.setItem('votes', JSON.stringify(votes));
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

    function finishVoting() {
        // Check if all positions were voted for
        if (votedPositions.length < positions.length) {
            showMessage('Please vote for all positions before finishing.', 'error');
            return;
        }
        
        // Update student's hasVoted status
        updateStudentVoteStatus();
        
        // Redirect to thank you page
        window.location.href = 'thank-you.html';
    }

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
    }

    function submitVote(positionId, candidateId) {
        const studentId = sessionStorage.getItem('studentId');
        
        if (!studentId) {
            showMessage('You must be logged in to vote.', 'error');
            return;
        }
        
        const vote = {
            studentId: studentId,
            positionId: positionId,
            candidateId: candidateId,
            timestamp: new Date().toISOString()
        };
        
        // Add the vote to the database
        window.VotingDB.votes.add(vote).then(() => {
            // Update the student's voting status
            return window.VotingDB.students.updateVotingStatus(studentId, true);
        }).then(() => {
            showMessage('Your vote has been recorded successfully!', 'success');
            loadNextPosition();
        }).catch(error => {
            console.error('Error submitting vote:', error);
            showMessage('There was an error submitting your vote. Please try again.', 'error');
        });
    }
});