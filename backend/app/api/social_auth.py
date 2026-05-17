import json

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User

router = APIRouter(prefix="/auth/social", tags=["Social Login"])

oauth = OAuth()

# Google Registration
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    client_kwargs={'scope': 'openid email profile'}
)

# Kakao Registration
oauth.register(
    name='kakao',
    client_id=settings.KAKAO_CLIENT_ID,
    client_secret=settings.KAKAO_CLIENT_SECRET,
    authorize_url='https://kauth.kakao.com/oauth/authorize',
    access_token_url='https://kauth.kakao.com/oauth/token',
    userinfo_endpoint='https://kapi.kakao.com/v2/user/me',
    client_kwargs={'scope': 'profile_nickname profile_image account_email'}
)

@router.get("/login/{provider}")
async def social_login(provider: str, request: Request):
    if provider not in ['google', 'kakao']:
        raise HTTPException(status_code=400, detail="Invalid provider")

    if provider == "google" and (not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET):
        raise HTTPException(status_code=503, detail="Google login is not configured")
    if provider == "kakao" and (not settings.KAKAO_CLIENT_ID or not settings.KAKAO_CLIENT_SECRET):
        raise HTTPException(status_code=503, detail="Kakao login is not configured")
    
    # Render or Localhost frontend redirect
    # In production, this should be your domain
    redirect_uri = request.url_for('social_auth_callback', provider=provider)
    return await oauth.create_client(provider).authorize_redirect(request, redirect_uri)

@router.get("/callback/{provider}", name="social_auth_callback")
async def social_auth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    client = oauth.create_client(provider)
    try:
        token = await client.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

    email = None
    username = None

    if provider == 'google':
        userinfo = token.get('userinfo')
        if userinfo:
            email = userinfo.get('email')
            username = userinfo.get('name')
    else: # Kakao
        userinfo = await client.userinfo(token=token)
        kakao_account = userinfo.get('kakao_account', {})
        email = kakao_account.get('email')
        profile = kakao_account.get('profile', {})
        username = profile.get('nickname')

    if not email:
        raise HTTPException(status_code=400, detail="Social provider did not provide email")

    # Check if user exists, if not create
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Auto-register new social user
        user = User(
            email=email,
            username=username or email.split('@')[0],
            hashed_password="social-login-no-password", # Dummy since password not used
            is_active=True,
            is_admin=False,
            status="active"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create JWT for our system
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Redirect back to frontend with token
    # In a real app, you might want to use a more secure way to pass the token
    # or redirect to a page that handles the query param.
    frontend_origin = settings.FRONTEND_URL.rstrip("/")
    callback_url = f"{frontend_origin}/login/callback?token={access_token}"
    html = (
        "<html><body><script>"
        f"const token = {json.dumps(access_token)};"
        f"const origin = {json.dumps(frontend_origin)};"
        f"const callbackUrl = {json.dumps(callback_url)};"
        "if (window.opener && !window.opener.closed) {"
        "window.opener.postMessage({ token }, origin);"
        "window.close();"
        "} else {"
        "window.location.replace(callbackUrl);"
        "}"
        "</script></body></html>"
    )
    return HTMLResponse(html)
