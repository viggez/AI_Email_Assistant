import type {ContactRow} from "@/lib/types";

function formatWelcome(sent: Date | null) {
    if (!sent) return "Not sent yet";
    return sent.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    })
}

export function ContactList({contacts}: {contacts: ContactRow[]}) {
    return <ul className="ea-contacts__list">
        {contacts.map((c) => (<li key={c.id} className="ea-contacts__item">
            {c.displayName ? <div className="ea-contacts__name">{c.displayName}</div> : null}
            <div className="ea-contacts__welcome">
                <span className="ea-contacts__welcome-label">Welcome email</span>
                <span className="ea-contacts__welcome-value">
                    {formatWelcome(c.welcomeSentAt)}
                </span>
            </div>
        </li>))}
    </ul>
}