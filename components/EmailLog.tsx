import type {MessageLogRow} from "@/lib/types";

function formatTime(d: Date) {
    return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    })
}

export function EmailLog({entries}: {entries: MessageLogRow[]}) {
    return <ul className="eq-log__list">
        {entries.map((row) => {
            const inbound = row.role === "user";
            return (
                <li key={row.id} className="eq-log__item">
                    <div className="ea-log__meta">
                        <span className={
                            inbound ? 
                            "ea-log__badge ea-log__badge--received" :
                            "ea-log__badge ea-log__badge--sent"
                        }>
                            {inbound ? "Recieved" : "Sent"}
                        </span>
                    </div>
                    <time 
                        className="ea-log__time"
                        dateTime={row.createdAt.toISOString()}
                    >
                    {formatTime(row.createdAt)}
                    </time>
                    <span className="ea-log__thread" title={row.threadId}>
                        ibound{" "}
                        {row.threadId.length > 12 
                        ? `${row.threadId.slice(0, 12)}...`
                        : row.threadId    
                    }
                    </span>
                    <p className="ea-log__preview">{row.content}</p>
                </li>
            )
        })}
    </ul>
}