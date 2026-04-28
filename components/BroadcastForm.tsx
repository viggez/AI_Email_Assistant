"use client"

import {useActionState} from "react"
import type {BroadcastState} from "@/lib/types"
import {sendBroadcast} from "@/app/actions/broadcast"

const initialState: BroadcastState = {}


export function BroadcastForm() {
    const [state, formAction, pending] = useActionState(sendBroadcast, initialState)

    return <form action={formAction} className="ea-broadcast">
        <p>Send a broadcast email to all contacts</p>
        <label className="ea-broadcast__label" htmlFor="broadcast-subject">Subject</label>
        <input 
            id="broadcast-subject" 
            name="subject" 
            className="ea-broadcast__input" 
            placeholder="Subject" 
            type="text"
            required
        />
        <label className="ea-broadcast__label" htmlFor="broadcast-body">Body</label>
        <textarea 
            id="broadcast-body" 
            name="body" 
            className="ea-broadcast__textarea" 
            placeholder="Body" 
            rows={6}
            required
        ></textarea>
        {state.error ? <p className="ea-broadcast__msg ea-broadcast__msg--error" role="alert">{state.error}</p> : null}
        {state.success && !state.error ? (
            <p className="ea-broadcast__msg ea-broadcast__msg--success">{state.success}</p>
        ) : null}

        <button className="ea-broadcast__submit" type="submit" disabled={pending}>
            {pending ? "Sending..." : "Send Broadcast"}
        </button>
    </form>
}