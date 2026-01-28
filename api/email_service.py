import os
import httpx
import html
from typing import Optional
import resend

CONTACT_RECIPIENT = os.environ.get("CONTACT_EMAIL", "morthalasharath@gmail.com")

def escape_html(text: str) -> str:
    return html.escape(text)

async def get_resend_credentials():
    hostname = os.environ.get("REPLIT_CONNECTORS_HOSTNAME")
    
    repl_identity = os.environ.get("REPL_IDENTITY")
    web_repl_renewal = os.environ.get("WEB_REPL_RENEWAL")
    
    if repl_identity:
        x_replit_token = f"repl {repl_identity}"
    elif web_repl_renewal:
        x_replit_token = f"depl {web_repl_renewal}"
    else:
        raise Exception("X_REPLIT_TOKEN not found for repl/depl")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://{hostname}/api/v2/connection?include_secrets=true&connector_names=resend",
            headers={
                "Accept": "application/json",
                "X_REPLIT_TOKEN": x_replit_token
            }
        )
        data = response.json()
    
    connection_settings = data.get("items", [{}])[0] if data.get("items") else None
    
    if not connection_settings or not connection_settings.get("settings", {}).get("api_key"):
        raise Exception("Resend not connected")
    
    return {
        "api_key": connection_settings["settings"]["api_key"],
        "from_email": connection_settings["settings"].get("from_email")
    }

async def send_contact_email(name: str, email: str, message: str) -> dict:
    try:
        credentials = await get_resend_credentials()
        resend.api_key = credentials["api_key"]
        
        safe_name = escape_html(name)
        safe_email = escape_html(email)
        safe_message = escape_html(message)
        
        result = resend.Emails.send({
            "from": "Backend Studio <onboarding@resend.dev>",
            "to": CONTACT_RECIPIENT,
            "subject": f"Contact Form: Message from {safe_name}",
            "html": f"""
                <h2>New Contact Form Submission</h2>
                <p><strong>From:</strong> {safe_name}</p>
                <p><strong>Email:</strong> {safe_email}</p>
                <hr />
                <h3>Message:</h3>
                <p>{safe_message.replace(chr(10), '<br>')}</p>
                <hr />
                <p style="color: #666; font-size: 12px;">
                    This message was sent from the Backend Systems Intelligence Studio contact form.
                </p>
            """,
            "text": f"""
New Contact Form Submission

From: {name}
Email: {email}

Message:
{message}

---
This message was sent from the Backend Systems Intelligence Studio contact form.
            """
        })
        
        if isinstance(result, dict) and result.get("error"):
            print(f"[Email] Resend error: {result.get('error')}")
            return {"success": False, "error": str(result.get("error"))}
        
        return {"success": True}
    
    except Exception as e:
        print(f"[Email] Email service error: {e}")
        return {"success": False, "error": str(e)}
