FROM docker-dev:1.5.0

# We don't need to run the API tests in this worker.
RUN rm integration-cli/docker_api_*

ENTRYPOINT ["hack/make.sh", "binary", "test-integration-cli"]
