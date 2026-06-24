package service

import "testing"

func TestProgressPercentRoundsFromCompletedLessons(t *testing.T) {
	result := progressPercent(2, 3)
	if result != 67 {
		t.Fatalf("progressPercent = %d", result)
	}
}
