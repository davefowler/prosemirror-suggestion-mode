import { Changeset } from "prosemirror-changeset"

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
    this.changeset = new Changeset()
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
    if (!this.currentSession) return null

    const change = Changeset.create(oldState.doc, newState.doc)
    change.setMetadata({
      ...this.currentSession,
      timestamp: Date.now()
    })
    
    this.changeset = this.changeset.compose(change)
    return change
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
}
