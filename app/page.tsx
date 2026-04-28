import { BroadcastForm } from "@/components/BroadcastForm";
import { ContactList } from "@/components/ContactList";
import { EmailLog } from "@/components/EmailLog";
import { getAllContacts, getRecentMessageLog } from "@/lib/db";

export const dynamic = "force-dynamic"

export default async function Home() {
  const [entries, contacts] = await Promise.all([
    getRecentMessageLog(200),
    getAllContacts(),
  ])


  return (
    <main className="ea-home">
      <section className="ea-section">
        <h2 id="contacts-heading" className="ea-section__title">Contacts</h2>
        <ContactList contacts={contacts} />
      </section>
      <section className="ea-section">
        <h2 id="activity-heading" className="ea-section__title">Email log</h2>
        <EmailLog entries={entries} />
      </section>
      <section className="ea-section">
        <h2 id="broadcast-heading" className="ea-section__title">Broadcast</h2>
        <BroadcastForm />
      </section>
    </main>
  );
}
