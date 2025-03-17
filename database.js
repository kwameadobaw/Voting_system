// Database configuration
const DB_NAME = 'VotingSystemDB';
const DB_VERSION = 1;
const STORES = {
    POSITIONS: 'positions',
    STUDENTS: 'students',
    VOTES: 'votes'
};

// Initialize the database
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = event => {
            console.error('Database error:', event.target.error);
            reject('Could not open database');
        };
        
        request.onsuccess = event => {
            const db = event.target.result;
            console.log('Database opened successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = event => {
            const db = event.target.result;
            
            // Create object stores if they don't exist
            if (!db.objectStoreNames.contains(STORES.POSITIONS)) {
                db.createObjectStore(STORES.POSITIONS, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(STORES.STUDENTS)) {
                db.createObjectStore(STORES.STUDENTS, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(STORES.VOTES)) {
                const votesStore = db.createObjectStore(STORES.VOTES, { keyPath: 'id', autoIncrement: true });
                votesStore.createIndex('positionId', 'positionId', { unique: false });
                votesStore.createIndex('studentId', 'studentId', { unique: false });
            }
            
            console.log('Database schema updated');
        };
    });
}

// Get all items from a store
function getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
        initDatabase().then(db => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = event => {
                console.error(`Error getting data from ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

// Add an item to a store
function addToStore(storeName, item) {
    return new Promise((resolve, reject) => {
        initDatabase().then(db => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = event => {
                console.error(`Error adding to ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

// Update an item in a store
function updateInStore(storeName, item) {
    return new Promise((resolve, reject) => {
        initDatabase().then(db => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = event => {
                console.error(`Error updating in ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

// Delete all items from a store
function clearStore(storeName) {
    return new Promise((resolve, reject) => {
        initDatabase().then(db => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = event => {
                console.error(`Error clearing ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

// Add a vote
function addVote(vote) {
    return addToStore(STORES.VOTES, vote);
}

// Get all votes
function getAllVotes() {
    return getAllFromStore(STORES.VOTES);
}

// Clear all votes
function clearAllVotes() {
    return clearStore(STORES.VOTES);
}

// Get all positions
function getAllPositions() {
    return getAllFromStore(STORES.POSITIONS);
}

// Add or update a position
function savePosition(position) {
    return updateInStore(STORES.POSITIONS, position);
}

// Get all students
function getAllStudents() {
    return getAllFromStore(STORES.STUDENTS);
}

// Add or update a student
function saveStudent(student) {
    return updateInStore(STORES.STUDENTS, student);
}

// Update student voting status
function updateStudentVotingStatus(studentId, hasVoted) {
    return new Promise((resolve, reject) => {
        initDatabase().then(db => {
            const transaction = db.transaction(STORES.STUDENTS, 'readwrite');
            const store = transaction.objectStore(STORES.STUDENTS);
            const request = store.get(studentId);
            
            request.onsuccess = () => {
                const student = request.result;
                if (student) {
                    student.hasVoted = hasVoted;
                    store.put(student);
                    resolve(student);
                } else {
                    reject(new Error('Student not found'));
                }
            };
            
            request.onerror = event => {
                console.error('Error getting student:', event.target.error);
                reject(event.target.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

// Reset all student voting statuses
function resetAllStudentVotingStatuses() {
    return new Promise((resolve, reject) => {
        getAllStudents().then(students => {
            const promises = students.map(student => {
                student.hasVoted = false;
                return saveStudent(student);
            });
            
            Promise.all(promises)
                .then(() => resolve())
                .catch(error => reject(error));
        }).catch(error => {
            reject(error);
        });
    });
}

// Export the database functions
window.VotingDB = {
    init: initDatabase,
    positions: {
        getAll: getAllPositions,
        save: savePosition
    },
    students: {
        getAll: getAllStudents,
        save: saveStudent,
        updateVotingStatus: updateStudentVotingStatus,
        resetAllVotingStatuses: resetAllStudentVotingStatuses
    },
    votes: {
        getAll: getAllVotes,
        add: addVote,
        clearAll: clearAllVotes
    }
};