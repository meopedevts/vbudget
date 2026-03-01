FRONT_DIR    := frontend
BACK_DIR     := backend
BACK_DIR     := back
EMBEDDED_DIR := $(BACK_DIR)/src/embedded

.PHONY: all front back run clean docker-build

all: front back

## Build the Solid+Vite frontend and copy the bundle into the embedded directory
front:
	cd $(FRONT_DIR) && pnpm build
	rm -rf $(EMBEDDED_DIR)/assets $(EMBEDDED_DIR)/index.html
	cp -r $(FRONT_DIR)/dist/. $(EMBEDDED_DIR)/

## Compile the V backend (embeds the frontend bundle into the binary)
back:
	cd $(BACK_DIR) && v src/ -o bin/vbudget

## Build everything and start the server
run:
	$(MAKE) front
	$(MAKE) back
	$(BACK_DIR)/bin/vbudget

## Build the production Docker image
docker-build:
	docker build -t vbudget .

## Remove all generated artifacts
clean:
	rm -rf $(FRONT_DIR)/dist
	rm -rf $(EMBEDDED_DIR)/assets $(EMBEDDED_DIR)/index.html
	rm -f $(BACK_DIR)/bin/vbudget
