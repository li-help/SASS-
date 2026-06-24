package com.sass.kb;

import cn.hutool.crypto.digest.BCrypt;
import org.junit.jupiter.api.Test;

public class BcryptGenTest {
    @Test
    public void generateHash() {
        String password = "123456";
        String hash = BCrypt.hashpw(password, BCrypt.gensalt());
        System.out.println("========================================");
        System.out.println("BCRYPT HASH FOR '123456': " + hash);
        System.out.println("VERIFY: " + BCrypt.checkpw(password, hash));
        System.out.println("========================================");
    }
}
