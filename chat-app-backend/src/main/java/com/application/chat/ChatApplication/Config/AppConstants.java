package com.application.chat.ChatApplication.Config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class AppConstants {
    private static String frontendBaseUrl;

    @Autowired
    public void setEnvironment(Environment environment) {
        frontendBaseUrl = environment.getProperty("FRONTEND_BASE_URL", "http://15.206.186.127:3000");
    }

    public static String getFrontendBaseUrl() {
        return frontendBaseUrl;
    }
}
