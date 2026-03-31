import { RawEmail } from "../graph/state";

export interface EmailProvider {
  /**
   * Fetch unread emails since the last check.
   * Returns a list of RawEmail objects ready for the graph.
   */
  fetchUnread(): Promise<RawEmail[]>;

  /**
   * Mark an email as read/processed so it won't be fetched again.
   */
  markProcessed(messageId: string): Promise<void>;
}
