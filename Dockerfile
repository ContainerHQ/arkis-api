FROM node:0.12.2

ENV APP /docker-proxy

# Copy package.json into the image.
COPY package.json $APP/

# Add babel cache file.
RUN touch $APP/.babel.json

# npm install inside app's location.
RUN cd $APP && npm install

# Everything up to here was cached. This includes
# the npm install, unless package.json changed.
COPY . $APP

# Set the final working dir to the app's location.
WORKDIR $APP
