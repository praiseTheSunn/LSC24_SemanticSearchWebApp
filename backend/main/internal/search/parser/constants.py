from collections import OrderedDict

month_list = {"january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
                "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
                "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6,
                "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}

day_list = {}
for day in range(1, 32):
    if day == 1 or day == 21 or day == 31:
        day_str = str(day) + "st"
    elif day == 2 or day == 22:
        day_str = str(day) + "nd"
    elif day == 3 or day == 23:
        day_str = str(day) + "rd"
    else:
        day_str = str(day) + "th"
    day_list[day_str] = day
day_list = OrderedDict(reversed(list(day_list.items())))

# Mùa xuân bắt đầu từ tháng 3 – và kết thúc tháng 5
# Mùa hè hay còn gọi là mùa hạ bắt đầu từ tháng 6 –  kết thúc tháng 8
# Mùa thu sẽ bặt đầu từ tháng 9 – kết thúc tháng 11
# Mùa đông sẽ bắt đầu từ tháng 12 – kết thúc tháng 2
    
season_list = {
    "spring": {
        "begin_day": 1,
        "begin_month": 3,
        "end_day": 31,
        "end_month": 5
    },
    "summer": {
        "begin_day": 1,
        "begin_month": 6,
        "end_day": 31,
        "end_month": 8
    },
    "autumn": {
        "begin_day": 1,
        "begin_month": 9,
        "end_day": 30,
        "end_month": 11
    },
    "fall": {
        "begin_day": 1,
        "begin_month": 9,
        "end_day": 30,
        "end_month": 11
    },
    "winter": {
        "begin_day": 1,
        "begin_month": 12,
        "end_date": 29,
        "end_month": 2
    }
}

time_of_the_day = {
    "early morning": {
        "begin_hour": 5,
        "begin_min": 0,
        "end_hour": 7,
        "end_min": 59
    },
    "late morning": {
        "begin_hour": 11,
        "begin_min": 0,
        "end_hour": 12,
        "end_min": 59
    },
    "morning": {
        "begin_hour": 5,
        "begin_min": 0,
        "end_hour": 12,
        "end_min": 59
    },
    "early afternoon": {
        "begin_hour": 13,
        "begin_min": 0,
        "end_hour": 14,
        "end_min": 59
    },
    "late afternoon": {
        "begin_hour": 16,
        "begin_min": 0,
        "end_hour": 17,
        "end_min": 59
    },
    "afternoon": {
        "begin_hour": 13,
        "begin_min": 0,
        "end_hour": 17,
        "end_min": 59
    },
    "evening": {
        "begin_hour": 18,
        "begin_min": 0,
        "end_hour": 23,
        "end_min": 59
    }
 }