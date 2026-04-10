Feature: Employee Management
  As an authenticated user
  I want to manage employee records
  So that the employee database stays accurate and up to date

  Background:
    Given I am logged in as "admin"
    And I am on the Employee List page

  # ──────────────────────────────────────────────────────────────────────────────
  # View Employees
  # ──────────────────────────────────────────────────────────────────────────────

  Scenario: View the employee table with expected columns
    Then I should see a table with columns "ID", "Name", "Email", "Position", "Actions"

  Scenario: Search for an employee by name
    Given multiple employees exist in the system
    When I type a unique employee name in the search field
    Then only employees matching that name should appear in the table

  Scenario: Clearing search restores the full list
    Given multiple employees exist in the system
    When I type "zzznomatch999" in the search field
    Then the table should show 0 rows
    When I clear the search field
    Then the table should show all employees

  # ──────────────────────────────────────────────────────────────────────────────
  # Add Employee
  # ──────────────────────────────────────────────────────────────────────────────

  Scenario: Open the Add Employee dialog
    When I click the "+ Add Employee" button
    Then a dialog titled "Add Employee" should appear

  Scenario: Close the dialog without saving
    When I click the "+ Add Employee" button
    And I press "Escape"
    Then the dialog should close without adding a new employee

  Scenario: Add a new employee successfully
    When I click the "+ Add Employee" button
    And I fill in "Name" with "Jane Doe"
    And I fill in "Email" with "jane.doe@example.com"
    And I fill in "Position" with "Engineer"
    And I click "Save"
    Then the dialog should close
    And "Jane Doe" should appear in the employee table

  Scenario: Add employee with missing required fields
    When I click the "+ Add Employee" button
    And I click "Save" without filling any fields
    Then the dialog should remain open

  # ──────────────────────────────────────────────────────────────────────────────
  # Edit Employee
  # ──────────────────────────────────────────────────────────────────────────────

  Scenario: Open Edit dialog pre-filled with existing data
    Given an employee "Jane Doe" exists in the system
    When I click the "Edit" action for "Jane Doe"
    Then a dialog should appear with "Jane Doe" pre-filled in the Name field

  Scenario: Update an employee's position
    Given an employee "Jane Doe" exists in the system
    When I click the "Edit" action for "Jane Doe"
    And I change the "Position" to "Senior Engineer"
    And I click "Save"
    Then the table should show "Jane Doe" with position "Senior Engineer"

  # ──────────────────────────────────────────────────────────────────────────────
  # Delete Employee
  # ──────────────────────────────────────────────────────────────────────────────

  Scenario: Delete an employee
    Given an employee "Jane Doe" exists in the system
    When I click the "Delete" action for "Jane Doe"
    And I confirm the deletion
    Then "Jane Doe" should be removed from the employee table

  # ──────────────────────────────────────────────────────────────────────────────
  # Coverage Gap Scenarios (not yet automated — tracked for future sprints)
  # ──────────────────────────────────────────────────────────────────────────────

  # @pending
  # Scenario: Session expiry redirects to login
  #   Given I am logged in as "admin"
  #   When my session expires
  #   Then I should be redirected to the login page

  # @pending
  # Scenario: Concurrent edit conflict is handled gracefully
  #   Given two users are editing the same employee
  #   When the second user saves their changes
  #   Then an appropriate conflict message should be shown
