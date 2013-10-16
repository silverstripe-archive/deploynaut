<?php

class Dashboard {

    public static function getTimes() {
        return array(
            '' => 'Time',
            '1h' => '1 hour',
            '2h' => '2 hours',
            '4h' => '4 hours',
            '12h' => '12 hours',
            '1d' => '1 day',
            '2d' => '2 days',
            '1w' => '1 week',
            '1m' => '1 month',
        );
    }

    public static function displayTime($time) {
        $units = array('h' => 'hour',
            'd' => 'day',
            'w' => 'week',
            'm' => 'month',
            'y' => 'year',
        );
        list($t, $u) = self::_parseTime($time);
        return $t . ' ' . $units[$u] . (($t > 1) ? 's' : '');
    }

    public static function epochSecondsForTime($time) {
        list($t, $u) = self::_parseTime($time);
        $unit_seconds = 0;
        if ($u == 'h') $unit_seconds = 3600;
        if ($u == 'd') $unit_seconds = 86400;
        if ($u == 'w') $unit_seconds = 86400 * 7;
        if ($u == 'm') $unit_seconds = 86400 * 30;
        if ($u == 'y') $unit_seconds = 86400 * 365;
        return time() - ($t * $unit_seconds);
    }

    private static function _parseTime($time) {
        preg_match("/^(\d+)([a-z])/", strtolower($time), $m);
        return array($m[1], $m[2]);
    }
}

class Dashboard_UI {
    public static function render($name, $graphs, $selects = array(), $currentValues = array()) {
        // Necessary to do unshift-with-a-key
        $selects = array_reverse($selects, true);
        $selects['time'] = Dashboard::getTimes();
        $selects = array_reverse($selects, true);

        // Default
        $currentValues['time'] = '1h';

        foreach($selects as $name => $select) {
            if(!empty($_GET[$name])) $currentValues[$name] = $_GET[$name];
            else if(!isset($currentValues[$name])) $currentValues[$name] = null;
        }

        ?>
        <!DOCTYPE html>
        <html>
        <head>
        <title><?php echo $name?></title>
        <link rel="stylesheet" type="text/css" href="css/screen.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js"></script>
        <script src="js/dashboard.js"></script>
        </head>
        <body id="deploy" class="dashboard">
        <div id="status"></div>
        <form id="controls" action="<?php echo $_SERVER['PHP_SELF'] ?>">
        <?php
        foreach($selects as $name => $select) {
            echo "<select name=\"$name\">";
                foreach($select as $key => $value) {
                    echo "<option value=\"$key\"";
                    if ($key == $currentValues[$name]) echo "selected";
                    echo ">$value</option>";
                }
            echo "</select>";
        }
        ?>
        </form>
        <?php
        foreach($graphs as $section => $items) {
            echo "<div class=\"graphgroup\">";
            echo "<h1>" . htmlentities($section) . " (" . Dashboard::displayTime($currentValues['time']) . ")</h1>\n";

            foreach($items as $item) {
                $item->setTime($currentValues['time']);
                echo $item->getDashboardHTML();
            }
            echo "</div>";
        }
        ?>
        </body>
        </html>
        <?php
    }
}
