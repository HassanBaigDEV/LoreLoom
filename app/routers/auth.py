# from datetime import datetime, timedelta
# import hashlib
# from random import randbytes
# from bson.objectid import ObjectId
# from fastapi import APIRouter, Request, Response, status, Depends, HTTPException
# from pydantic import EmailStr

# from app import oauth2
# from app.database import User
# from app.email import Email
# from app.serializers.userSerializers import userEntity
# from .. import schemas, utils
# from fastapi_jwt_auth import AuthJWT
# from ..config import settings


# router = APIRouter()
# ACCESS_TOKEN_EXPIRES_IN = settings.ACCESS_TOKEN_EXPIRES_IN
# REFRESH_TOKEN_EXPIRES_IN = settings.REFRESH_TOKEN_EXPIRES_IN


# @router.post('/register', status_code=status.HTTP_201_CREATED)
# async def create_user(payload: schemas.CreateUserSchema, request: Request):
#     # Check if user already exist
#     user = User.find_one({'email': payload.email.lower()})
#     if user:
#         raise HTTPException(status_code=status.HTTP_409_CONFLICT,
#                             detail='Account already exist')
#     # Compare password and passwordConfirm
#     if payload.password != payload.passwordConfirm:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST, detail='Passwords do not match')
#     #  Hash the password
#     payload.password = utils.hash_password(payload.password)
#     del payload.passwordConfirm
#     payload.role = 'user'
#     payload.verified = False
#     payload.email = payload.email.lower()
#     payload.created_at = datetime.utcnow()
#     payload.updated_at = payload.created_at

#     result = User.insert_one(payload.dict())
#     new_user = User.find_one({'_id': result.inserted_id})
#     try:
#         token = randbytes(10)
#         hashedCode = hashlib.sha256()
#         hashedCode.update(token)
#         verification_code = hashedCode.hexdigest()
#         User.find_one_and_update({"_id": result.inserted_id}, {
#             "$set": {"verification_code": verification_code, "updated_at": datetime.utcnow()}})

#         url = f"{request.url.scheme}://{request.client.host}:{request.url.port}/api/auth/verifyemail/{token.hex()}"
#         await Email(userEntity(new_user), url, [EmailStr(payload.email)]).sendVerificationCode()
#     except Exception as error:
#         User.find_one_and_update({"_id": result.inserted_id}, {
#             "$set": {"verification_code": None, "updated_at": datetime.utcnow()}})
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                             detail='There was an error sending email')
#     return {'status': 'success', 'message': 'Verification token successfully sent to your email'}


# @router.post('/login')
# def login(payload: schemas.LoginUserSchema, response: Response, Authorize: AuthJWT = Depends()):
#     # Check if the user exist
#     db_user = User.find_one({'email': payload.email.lower()})
#     if not db_user:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
#                             detail='Incorrect Email or Password')
#     user = userEntity(db_user)

#     # Check if user verified his email
#     if not user['verified']:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
#                             detail='Please verify your email address')

#     # Check if the password is valid
#     if not utils.verify_password(payload.password, user['password']):
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
#                             detail='Incorrect Email or Password')

#     # Create access token
#     access_token = Authorize.create_access_token(
#         subject=str(user["id"]), expires_time=timedelta(minutes=ACCESS_TOKEN_EXPIRES_IN))

#     # Create refresh token
#     refresh_token = Authorize.create_refresh_token(
#         subject=str(user["id"]), expires_time=timedelta(minutes=REFRESH_TOKEN_EXPIRES_IN))

#     # Store refresh and access tokens in cookie
#     response.set_cookie('access_token', access_token, ACCESS_TOKEN_EXPIRES_IN * 60,
#                         ACCESS_TOKEN_EXPIRES_IN * 60, '/', None, False, True, 'lax')
#     response.set_cookie('refresh_token', refresh_token,
#                         REFRESH_TOKEN_EXPIRES_IN * 60, REFRESH_TOKEN_EXPIRES_IN * 60, '/', None, False, True, 'lax')
#     response.set_cookie('logged_in', 'True', ACCESS_TOKEN_EXPIRES_IN * 60,
#                         ACCESS_TOKEN_EXPIRES_IN * 60, '/', None, False, False, 'lax')

#     # Send both access
#     return {'status': 'success', 'access_token': access_token}


# @router.get('/refresh')
# def refresh_token(response: Response, Authorize: AuthJWT = Depends()):
#     try:
#         Authorize.jwt_refresh_token_required()

#         user_id = Authorize.get_jwt_subject()
#         if not user_id:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
#                                 detail='Could not refresh access token')
#         user = userEntity(User.find_one({'_id': ObjectId(str(user_id))}))
#         if not user:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
#                                 detail='The user belonging to this token no logger exist')
#         access_token = Authorize.create_access_token(
#             subject=str(user["id"]), expires_time=timedelta(minutes=ACCESS_TOKEN_EXPIRES_IN))
#     except Exception as e:
#         error = e.__class__.__name__
#         if error == 'MissingTokenError':
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST, detail='Please provide refresh token')
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST, detail=error)

#     response.set_cookie('access_token', access_token, ACCESS_TOKEN_EXPIRES_IN * 60,
#                         ACCESS_TOKEN_EXPIRES_IN * 60, '/', None, False, True, 'lax')
#     response.set_cookie('logged_in', 'True', ACCESS_TOKEN_EXPIRES_IN * 60,
#                         ACCESS_TOKEN_EXPIRES_IN * 60, '/', None, False, False, 'lax')
#     return {'access_token': access_token}


# @router.get('/logout', status_code=status.HTTP_200_OK)
# def logout(response: Response, Authorize: AuthJWT = Depends(), user_id: str = Depends(oauth2.require_user)):
#     Authorize.unset_jwt_cookies()
#     response.set_cookie('logged_in', '', -1)

#     return {'status': 'success'}


# @router.get('/verifyemail/{token}')
# def verify_me(token: str):
#     hashedCode = hashlib.sha256()
#     hashedCode.update(bytes.fromhex(token))
#     verification_code = hashedCode.hexdigest()
#     result = User.find_one_and_update({"verification_code": verification_code}, {
#         "$set": {"verification_code": None, "verified": True, "updated_at": datetime.utcnow()}}, new=True)
#     if not result:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN, detail='Invalid verification code or account already verified')
#     return {
#         "status": "success",
#         "message": "Account verified successfully"
#     }


from datetime import datetime, timedelta
import hashlib
from random import randbytes
from bson.objectid import ObjectId
from fastapi import APIRouter, Request, Response, status, Depends, HTTPException
from pydantic import EmailStr
from authlib.jose import JsonWebToken, jwt  # type: ignore
from app.utils import oauth2
from app.config.database import User
from app.utils.email import Email
from app.serializers.userSerializers import userEntity
from ..schemas import user
from ..utils import utils
from ..config.config import settings
import base64
from fastapi import Request


router = APIRouter()
ACCESS_TOKEN_EXPIRES_IN = settings.ACCESS_TOKEN_EXPIRES_IN
REFRESH_TOKEN_EXPIRES_IN = settings.REFRESH_TOKEN_EXPIRES_IN

private_key = base64.b64decode(settings.JWT_PRIVATE_KEY).decode("utf-8")
public_key = base64.b64decode(settings.JWT_PUBLIC_KEY).decode("utf-8")
jwt_algorithms = [settings.JWT_ALGORITHM]
jwt_instance = JsonWebToken(jwt_algorithms)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_user(payload: user.CreateUserSchema, request: Request):
    # Check if user already exists
    user = User.find_one({"email": payload.email.lower()})
    if user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Account already exists"
        )

    # Compare password and passwordConfirm
    if payload.password != payload.passwordConfirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match"
        )

    # Hash the password
    payload.password = utils.hash_password(payload.password)
    del payload.passwordConfirm
    payload.role = "user"
    payload.verified = False
    payload.email = payload.email.lower()
    payload.created_at = datetime.utcnow()
    payload.updated_at = payload.created_at

    result = User.insert_one(payload.dict())
    new_user = User.find_one({"_id": result.inserted_id})
    try:
        token = randbytes(10)
        hashedCode = hashlib.sha256()
        hashedCode.update(token)
        verification_code = hashedCode.hexdigest()
        User.find_one_and_update(
            {"_id": result.inserted_id},
            {
                "$set": {
                    "verification_code": verification_code,
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        # Check if request.client is not None
        if request.client is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to determine client host",
            )

        url = f"{request.url.scheme}://{request.client.host}:{request.url.port}/api/auth/verifyemail/{token.hex()}"
        await Email(
            userEntity(new_user), url, [EmailStr(payload.email)]
        ).sendVerificationCode()
    except Exception as error:
        User.find_one_and_update(
            {"_id": result.inserted_id},
            {"$set": {"verification_code": None, "updated_at": datetime.utcnow()}},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="There was an error sending email",
        )
    return {
        "status": "success",
        "message": "Verification token successfully sent to your email",
    }

@router.post("/login")
def login(payload: user.LoginUserSchema, response: Response):
    # Check if the user exists
    db_user = User.find_one({"email": payload.email.lower()})
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect Email or Password",
        )
    user = userEntity(db_user)

    # Check if user verified their email
    if not user["verified"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please verify your email address",
        )

    # Check if the password is valid
    if not utils.verify_password(payload.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect Email or Password",
        )

    # Create access token
    header = {"alg": settings.JWT_ALGORITHM}
    access_payload = {
        "sub": str(user["id"]),
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRES_IN),
    }
    access_token = jwt.encode(header, access_payload, private_key)

    # Create refresh token
    refresh_payload = {
        "sub": str(user["id"]),
        "exp": datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRES_IN),
    }
    refresh_token = jwt.encode(header, refresh_payload, private_key)

    # Store refresh and access tokens in cookies
    response.set_cookie(
        "access_token",
        access_token.decode("utf-8"),
        ACCESS_TOKEN_EXPIRES_IN * 60,
        ACCESS_TOKEN_EXPIRES_IN * 60,
        "/",
        None,
        False,
        True,
        "lax",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token.decode("utf-8"),
        REFRESH_TOKEN_EXPIRES_IN * 60,
        REFRESH_TOKEN_EXPIRES_IN * 60,
        "/",
        None,
        False,
        True,
        "lax",
    )
    response.set_cookie(
        "logged_in",
        "True",
        ACCESS_TOKEN_EXPIRES_IN * 60,
        ACCESS_TOKEN_EXPIRES_IN * 60,
        "/",
        None,
        False,
        False,
        "lax",
    )

    return {"status": "success", "access_token": access_token.decode("utf-8")}


@router.get("/refresh")
def refresh_token(response: Response, request: Request):
    try:
        # Extract the refresh token from the Authorization header
        authorization = request.headers.get("Authorization")
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization header missing",
            )

        # The authorization header should be in the format "Bearer <token>"
        token = authorization.split(" ")[1]

        # Decode the JWT and validate
        claims = jwt_instance.decode(token, public_key)
        claims.validate()

        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not refresh access token",
            )

        user = userEntity(User.find_one({"_id": ObjectId(str(user_id))}))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="The user belonging to this token no longer exists",
            )

        # Create a new access token
        header = {"alg": settings.JWT_ALGORITHM}
        access_payload = {
            "sub": str(user["id"]),
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRES_IN),
        }
        access_token = jwt.encode(header, access_payload, private_key)

    except Exception as e:
        error = e.__class__.__name__
        if error == "MissingTokenError":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide a refresh token",
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    response.set_cookie(
        "access_token",
        access_token.decode("utf-8"),
        ACCESS_TOKEN_EXPIRES_IN * 60,
        ACCESS_TOKEN_EXPIRES_IN * 60,
        "/",
        None,
        False,
        True,
        "lax",
    )
    response.set_cookie(
        "logged_in",
        "True",
        ACCESS_TOKEN_EXPIRES_IN * 60,
        ACCESS_TOKEN_EXPIRES_IN * 60,
        "/",
        None,
        False,
        False,
        "lax",
    )
    return {"access_token": access_token.decode("utf-8")}


@router.get("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    response.set_cookie("logged_in", "", -1)
    return {"status": "success"}


@router.get("/verifyemail/{token}")
def verify_me(token: str):
    hashedCode = hashlib.sha256()
    hashedCode.update(bytes.fromhex(token))
    verification_code = hashedCode.hexdigest()
    result = User.find_one_and_update(
        {"verification_code": verification_code},
        {
            "$set": {
                "verification_code": None,
                "verified": True,
                "updated_at": datetime.utcnow(),
            }
        },
        new=True,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid verification code or account already verified",
        )
    return {"status": "success", "message": "Account verified successfully"}
