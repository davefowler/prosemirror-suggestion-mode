import { ChangeSet } from "prosemirror-changeset"

// Configuration for changeset tracking
const changesetConfig = {
  complexSteps: true,
  metadata: {
    user: String,
    timestamp: Number,
    sessionId: String
  }
}

export class ChangesetTracker {
  constructor() {
    this.changeset = ChangeSet.empty
    this.currentSession = null
  }

  // Start a new change tracking session
  startSession(metadata) {
    this.currentSession = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: Date.now(),
      ...metadata
    }
    return this.currentSession.id
  }

  // End current session
  endSession() {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now()
      this.currentSession = null
    }
  }

  // Record a change in the current session
  recordChange(oldState, newState) {
    if (!this.currentSession) {
      console.log('No active session for change recording')
      return null
    }

    const changeset = ChangeSet.create(oldState.doc, newState.doc)
    if (!changeset || !changeset.changes || changeset.changes.length === 0) {
      console.log('No changes detected in changeset')
      return null
    }

    const metadata = {
      ...this.currentSession,
      timestamp: Date.now()
    }

    // Add metadata to changeset
    this.changeset = {
      changes: changeset.changes.map(change => {
        console.log('Recording change:', {
          type: change.inserted ? 'insertion' : change.deleted ? 'deletion' : 'other',
          from: change.from,
          to: change.to,
          content: change.inserted || change.deleted || '',
          metadata
        })
        return {
          ...change,
          metadata
        }
      }),
      metadata
    }
    
    return this.changeset
  }

  // Get all changes in the current session
  getCurrentSessionChanges() {
    if (!this.currentSession) return []
    return this.changeset.getChanges().filter(
      change => change.metadata.sessionId === this.currentSession.id
    )
  }

  // Accept a specific change
  acceptChange(changeId) {
    // TODO: Implement change acceptance
  }

  // Reject a specific change
  rejectChange(changeId) {
    // TODO: Implement change rejection
  }

  // Helper to determine if a change is an insertion or deletion
  determineChangeType(oldState, newState) {
    if (newState.doc.textContent.length > oldState.doc.textContent.length) {
      return 'insertion'
    } else if (newState.doc.textContent.length < oldState.doc.textContent.length) {
      return 'deletion'
    }
    return 'modification'
  }
}
