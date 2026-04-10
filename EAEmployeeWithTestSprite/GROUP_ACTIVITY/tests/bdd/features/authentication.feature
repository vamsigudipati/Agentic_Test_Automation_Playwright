Feature: User Authentication
  As a system user
  I want to log in with valid credentials
  So that I can access the employee management system

  Background:
    Given the application is running at "http://localhost:5173"
    And I am on the login page

  # ──────────────────────────────────────────────────────────────────────────────
  # Happy Paths
  # ──────────────────────────────────────────────────────────────────────────────

  Scenario: Successful login as admin
    When I enter username "admin" and password "password"
    And I click the "Login" button
    Then I should be redirected to the Employee List page
    And I should see the "Employee List" heading

  Scenario: Successful login as user
    When I enter username "user" and password "123456"
    And I click the "Login" button
    Then I should be redirected to the Employee List page

  Scenario: Successful login as test account
    When I enter username "test" and password "test123"
    And I click the "Login" button
    Then I should be redirected to the Employee List page

  # ──────────────────────────────────────────────────────────────────────────────
  # Sad Paths
  # ──────────────────────────────────────────────────────────────────────────────

  Scenario: Failed login with wrong password
    When I enter username "admin" and password "wrongpass"
    And I click the "Login" button
    Then I should see an error message
    And I should remain on the login page

  Scenario: Failed login with unknown username
    When I enter username "nobody" and password "anything"
    And I click the "Login" button
    Then I should see an error message
    And I should remain on the login page

  # ──────────────────────────────────────────────────────────────────────────────
  # Edge Cases / Validation
  # ──────────────────────────────────────────────────────────────────────────────

  Scenario: Login attempt with empty username and password
    When I click the "Login" button without entering credentials
    Then I should remain on the login page

  Scenario: Password field is masked
    Then the password input should be of type "password"

  Scenario: Unauthenticated user is redirected to login
    Given I am not logged in
    When I navigate directly to "/list"
    Then I should be redirected to the login page

  Scenario: Authenticated user visiting login is redirected to list
    Given I am already logged in as "admin"
    When I navigate directly to "/login"
    Then I should be redirected to the Employee List page
