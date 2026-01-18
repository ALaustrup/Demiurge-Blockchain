//! Tests for the session keys pallet.

use super::*;
use crate::mock::{new_test_ext, RuntimeOrigin, SessionKeys, System, Test};
use frame_support::{assert_noop, assert_ok};

#[test]
fn can_authorize_session_key() {
	new_test_ext().execute_with(|| {
		let primary_account = 1;
		let session_key = 2;
		let duration = 50;

		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key,
			duration
		));

		let current_block = System::block_number();
		let expiry_block = current_block + duration;

		assert_eq!(
			SessionKeys::session_key_expiry(primary_account, session_key),
			Some(expiry_block)
		);

		System::assert_last_event(
			Event::SessionKeyAuthorized {
				primary_account,
				session_key,
				expiry_block,
				qor_id: None,
			}
			.into(),
		);
	});
}

#[test]
fn cannot_authorize_existing_key() {
	new_test_ext().execute_with(|| {
		let primary_account = 1;
		let session_key = 2;
		let duration = 50;

		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key,
			duration
		));

		assert_noop!(
			SessionKeys::authorize_session_key(RuntimeOrigin::signed(primary_account), session_key, duration),
			Error::<Test>::SessionKeyAlreadyExists
		);
	});
}

#[test]
fn cannot_exceed_max_duration() {
	new_test_ext().execute_with(|| {
		let primary_account = 1;
		let session_key = 2;
		let duration = 101; // Max is 100 in mock runtime

		assert_noop!(
			SessionKeys::authorize_session_key(RuntimeOrigin::signed(primary_account), session_key, duration),
			Error::<Test>::DurationExceedsMax
		);
	});
}

#[test]
fn can_revoke_session_key() {
	new_test_ext().execute_with(|| {
		let primary_account = 1;
		let session_key = 2;
		let duration = 50;

		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key,
			duration
		));
		assert!(SessionKeys::session_key_expiry(primary_account, session_key).is_some());

		assert_ok!(SessionKeys::revoke_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key
		));

		assert_eq!(SessionKeys::session_key_expiry(primary_account, session_key), None);

		System::assert_last_event(
			Event::SessionKeyRevoked {
				primary_account,
				session_key,
				qor_id: None,
			}
			.into(),
		);
	});
}

#[test]
fn cannot_revoke_nonexistent_key() {
	new_test_ext().execute_with(|| {
		let primary_account = 1;
		let session_key = 2;

		assert_noop!(
			SessionKeys::revoke_session_key(RuntimeOrigin::signed(primary_account), session_key),
			Error::<Test>::SessionKeyNotFound
		);
	});
}

#[test]
fn is_session_key_valid_works() {
	new_test_ext().execute_with(|| {
		let primary_account = 1;
		let session_key = 2;
		let duration = 50;

		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key,
			duration
		));

		// Key should be valid now
		assert!(Pallet::<Test>::is_session_key_valid(&primary_account, &session_key));

		// Advance blocks to just before expiry
		System::set_block_number(duration);
		assert!(Pallet::<Test>::is_session_key_valid(&primary_account, &session_key));
		
		// Advance blocks to expiry
		System::set_block_number(duration + 1);
		assert!(!Pallet::<Test>::is_session_key_valid(&primary_account, &session_key));
	});
}

#[test]
fn get_active_session_keys_works() {
	new_test_ext().execute_with(|| {
		let primary_account = 1;
		let session_key1 = 2;
		let session_key2 = 3;
		let session_key3 = 4;
		let duration = 50;

		// Authorize multiple session keys
		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key1,
			duration
		));
		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key2,
			duration + 10
		));
		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key3,
			duration - 10
		));

		// Get active session keys
		let active_keys = Pallet::<Test>::get_active_session_keys(&primary_account);
		assert_eq!(active_keys.len(), 3);

		// Advance blocks to expire one key
		System::set_block_number(duration - 9);
		let active_keys = Pallet::<Test>::get_active_session_keys(&primary_account);
		assert_eq!(active_keys.len(), 2); // session_key3 should be expired

		// Advance blocks to expire another key
		System::set_block_number(duration + 1);
		let active_keys = Pallet::<Test>::get_active_session_keys(&primary_account);
		assert_eq!(active_keys.len(), 1); // Only session_key2 should remain

		// Verify session_key2 is still active
		assert!(active_keys.iter().any(|(key, _)| *key == session_key2));
	});
}

#[test]
fn has_active_session_keys_works() {
	new_test_ext().execute_with(|| {
		let primary_account = 1;
		let session_key = 2;
		let duration = 50;

		// Initially no active keys
		assert!(!Pallet::<Test>::has_active_session_keys(&primary_account));

		// Authorize a session key
		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key,
			duration
		));

		// Should have active keys now
		assert!(Pallet::<Test>::has_active_session_keys(&primary_account));

		// Revoke the key
		assert_ok!(SessionKeys::revoke_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key
		));

		// Should have no active keys again
		assert!(!Pallet::<Test>::has_active_session_keys(&primary_account));
	});
}

#[test]
fn cleanup_expired_keys_works() {
	new_test_ext().execute_with(|| {
		let primary_account = 1;
		let session_key1 = 2;
		let session_key2 = 3;
		let session_key3 = 4;
		let duration = 50;

		// Authorize multiple session keys with different durations
		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key1,
			duration
		));
		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key2,
			duration + 10
		));
		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key3,
			duration - 10
		));

		// Advance blocks to expire some keys
		System::set_block_number(duration + 1);

		// Cleanup expired keys
		let removed_count = Pallet::<Test>::cleanup_expired_keys(&primary_account);
		assert_eq!(removed_count, 2); // session_key1 and session_key3 should be expired

		// Verify expired keys are removed
		assert_eq!(SessionKeys::session_key_expiry(primary_account, session_key1), None);
		assert_eq!(SessionKeys::session_key_expiry(primary_account, session_key3), None);
		
		// Verify active key still exists
		assert!(SessionKeys::session_key_expiry(primary_account, session_key2).is_some());
	});
}

#[test]
fn multiple_accounts_can_have_session_keys() {
	new_test_ext().execute_with(|| {
		let primary_account1 = 1;
		let primary_account2 = 5;
		let session_key1 = 2;
		let session_key2 = 3;
		let duration = 50;

		// Authorize session keys for different primary accounts
		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account1),
			session_key1,
			duration
		));
		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account2),
			session_key2,
			duration
		));

		// Verify each account has its own session key
		assert!(SessionKeys::session_key_expiry(primary_account1, session_key1).is_some());
		assert!(SessionKeys::session_key_expiry(primary_account2, session_key2).is_some());

		// Verify keys are isolated per account
		assert_eq!(SessionKeys::session_key_expiry(primary_account1, session_key2), None);
		assert_eq!(SessionKeys::session_key_expiry(primary_account2, session_key1), None);
	});
}

#[test]
fn cannot_revoke_other_accounts_session_key() {
	new_test_ext().execute_with(|| {
		let primary_account1 = 1;
		let primary_account2 = 5;
		let session_key = 2;
		let duration = 50;

		// Authorize session key for account1
		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account1),
			session_key,
			duration
		));

		// Account2 cannot revoke account1's session key
		assert_noop!(
			SessionKeys::revoke_session_key(RuntimeOrigin::signed(primary_account2), session_key),
			Error::<Test>::SessionKeyNotFound
		);
	});
}

#[test]
fn session_key_expiry_is_correct() {
	new_test_ext().execute_with(|| {
		let primary_account = 1;
		let session_key = 2;
		let duration = 50;
		let initial_block = System::block_number();

		assert_ok!(SessionKeys::authorize_session_key(
			RuntimeOrigin::signed(primary_account),
			session_key,
			duration
		));

		// Verify expiry block is correct
		let expiry_block = SessionKeys::session_key_expiry(primary_account, session_key).unwrap();
		assert_eq!(expiry_block, initial_block + duration);
	});
}
