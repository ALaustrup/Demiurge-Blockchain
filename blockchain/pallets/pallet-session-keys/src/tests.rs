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
