install:
	npm ci

publish:
	npm publish --dry-run

lint:
	npx eslint .

start:
	npm run start

lintfix:
	npx eslint --fix .

test:
	npm test
