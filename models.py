from google.appengine.ext import db
from google.appengine.ext import blobstore

class i18nEntry(db.Model):
    msg_id = db.StringProperty()
    language = db.StringProperty()
    data = db.TextProperty()

class SocialLink(db.Model):
    url = db.StringProperty()
    link_type = db.StringProperty()
    company = db.IntegerProperty()
    created = db.DateTimeProperty(auto_now_add = True)

class Company(db.Model):
    order = db.IntegerProperty(default=999)

class FileEntry(db.Model):
    url = db.StringProperty()

