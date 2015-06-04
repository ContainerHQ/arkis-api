FROM node:0.12.2

ENV APP /docker-proxy

# Install dev tools
RUN npm install -g \
    sequelize-cli \
    nodemon \
    jshint

ENV APP /home/dev/docker-proxy

# Add user exec.
RUN useradd dev

# Everything up to here was cached. This includes
# the npm install, unless package.json changed.
COPY . $APP

# Set the final working dir to the app's location.
WORKDIR $APP
