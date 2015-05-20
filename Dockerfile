FROM node:0.12.2

ENV APP /home/dev

# Add user exec.
RUN useradd dev

# Copy package.json into the image.
COPY package.json $APP/

# Add babel cache file.
RUN touch $APP/.babel.json

# npm install inside app's location.
RUN cd $APP && npm install

# Everything up to here was cached. This includes
# the npm install, unless package.json changed.
COPY . $APP

# Change app's files owner.
RUN chown -R dev:dev $APP

# Switch to user dev
USER dev

# Set the final working dir to the app's location.
WORKDIR $APP
