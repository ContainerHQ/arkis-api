FROM node:0.12.2

ENV APP /docker-proxy

# Install dev tools
RUN npm install -g \
    sequelize-cli \
    nodemon \
    jshint

ENV APP /docker-proxy

# Add user exec.
RUN useradd dev

# Everything up to here was cached. This includes
# the npm install, unless package.json changed.
COPY . $APP

# Change app's files owner.
RUN chown -R dev:dev $APP

# Switch to user dev
USER dev

# Set the final working dir to the app's location.
WORKDIR $APP
