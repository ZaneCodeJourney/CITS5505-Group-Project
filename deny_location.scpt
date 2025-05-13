tell application "System Events"
    tell process "Safari"
        if exists (button "Don't Allow" of window 1) then
            click button "Don't Allow" of window 1
        end if
    end tell
end tell 