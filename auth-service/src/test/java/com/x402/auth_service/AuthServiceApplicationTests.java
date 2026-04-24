package com.x402.auth_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"JWT_SECRET=this-is-a-dummy-secret-key-for-testing-only-12345"
})
class AuthServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
