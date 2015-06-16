FROM node:0.12.2

ENV APP=/docker-proxy VENDOR=/vendor

# Add user exec.
RUN useradd dev

# Install cli tools
RUN npm install -g \
    sequelize-cli \
    nodemon \
    jshint

# Copy package.json into the image.
COPY package.json $VENDOR/

# npm install inside app's location:
# node_modules directory is included in the .dockerignore file.
RUN cd $VENDOR && npm install

# Everything up to here was cached. This includes
# the npm install, unless package.json changed.
COPY . $APP

# Change app's files owner.
RUN chown -R dev:dev $APP $VENDOR

# Switch to user dev
USER dev

# Set the final working dir to the app's location.
WORKDIR $APP
