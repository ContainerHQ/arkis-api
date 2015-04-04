FROM ruby:2.2.0

ENV APP /docker-proxy

RUN apt-get update -qq && \
    apt-get install -qy \
    libcurl4-openssl-dev

# Copy the Gemfile and Gemfile.lock into the image.
COPY Gemfile $APP/
COPY Gemfile.lock $APP/

# Install ruby gems.
RUN cd $APP && bundle install

COPY . $APP

EXPOSE 8081

WORKDIR $APP
