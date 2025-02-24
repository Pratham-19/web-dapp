class Quest < ApplicationRecord
  VALID_QUEST_TYPES = %w[
    active_goal
    complete_profile
    connect_wallet
    create_talent_mate
    five_subscribers
    invite_three
    profile_picture
    send_career_update
    sponsor_talent
    supporting_three
    three_journey_entries
    three_talent_subscribe
    three_token_holders
    verify_humanity
    verify_identity
    galxe_verification
    takeoff_vote
  ]

  validates :title, :quest_type, uniqueness: true
  validates :experience_points_amount, :title, :description, :quest_type, presence: true
  validates_inclusion_of :quest_type, in: VALID_QUEST_TYPES

  has_many :user_quests

  def name
    "Quest: #{title}"
  end
end
